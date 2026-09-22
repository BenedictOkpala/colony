import type { IncomingMessage, ServerResponse } from 'http';
import type { CharacterState, ChatMessage } from '../src/types/characterState';
import { CanonicalDialogue } from './canonicalDialogue';

export interface ChatRequestBody {
  characterState: CharacterState;
  userMessage: string;
  history: ChatMessage[];
}

export interface GroundedContext {
  relevantFacts: string[];
  defaultFallback: string;
}

export function getGroundedContext(state: CharacterState, userMessage: string): GroundedContext {
  const defaultFallback = CanonicalDialogue.getCanonicalFallback(state, userMessage);
  const relevantFacts = CanonicalDialogue.getAllowedFacts(state, userMessage);

  return {
    relevantFacts,
    defaultFallback
  };
}

function buildSystemPrompt(state: CharacterState, relevantFacts: string[]): string {
  return `You are roleplaying as ${state.name}, an ant technician inside COLONY, a futuristic underground ant colony.

CHARACTER PROFILE:
- Name: ${state.name}
- Occupation: ${state.occupation}
- Personality: ${state.personality}
- Location: ${state.currentLocation}

ALLOWED ANSWER FACTS (Use ONLY these grounded facts to answer the question):
${relevantFacts.map(f => `- ${f}`).join('\n')}

RESPONSE CONTRACT:
1. Answer the investigator's question naturally in the first person ("I", "my", "me") using the ALLOWED ANSWER FACTS above.
2. Keep your answer short and concise (1-2 sentences maximum).
3. Do NOT repeat or echo the player's question.
4. Do NOT invent new facts or contradict your character profile.
5. NEVER speak in the third person or describe ${state.name} ("${state.name} is...", "he feels...", "she says...").
6. Do NOT include any meta commentary, thinking, instructions, or notes (e.g. no "Also, note:", no "Note:", no formatting analysis).
7. Output ONLY the spoken dialogue.`;
}

export function cleanAndExtractDialogue(rawText: string): string {
  let text = rawText.trim();
  // 1. Strip <think> tags
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Strip speaker prefixes like "Vale:", "Dialogue:", "Response:"
  text = text.replace(/^(dialogue|spoken|response|answer|\w+ says|\w+):\s*/i, '').trim();

  // 3. If quotes exist and contain clean dialogue, extract them
  const quoteMatch = text.match(/["“]([^"”]{4,})["”]/);
  if (quoteMatch && quoteMatch[1] && !isMetaOrReasoning(quoteMatch[1])) {
    return quoteMatch[1].trim();
  }

  // 4. If multiple paragraphs, check if the last paragraph is the actual dialogue
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) {
    const lastP = paragraphs[paragraphs.length - 1];
    if (!isMetaOrReasoning(lastP)) {
      text = lastP;
    }
  }

  // 5. Strip surrounding quotes
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith('“') && text.endsWith('”')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }

  return text;
}

export function isQuestionEcho(reply: string, userMessage: string): boolean {
  if (!reply || !userMessage) return false;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const normReply = normalize(reply);
  const normUser = normalize(userMessage);

  if (!normReply || !normUser) return false;

  // 1. Exact or near-exact match
  if (normReply === normUser) return true;

  // 2. Reply starts with or contains user question and has similar length
  if (normUser.length >= 8) {
    if (normReply.startsWith(normUser) && normReply.length <= normUser.length + 15) {
      return true;
    }
    if (normReply.includes(normUser) && normReply.length <= normUser.length + 20) {
      return true;
    }
  }

  // 3. High word-overlap echo check for question patterns
  const userWords = normUser.split(' ').filter(w => w.length > 2);
  if (userWords.length >= 3) {
    const replyWords = new Set(normReply.split(' ').filter(w => w.length > 2));
    const matchingCount = userWords.filter(w => replyWords.has(w)).length;
    const matchRatio = matchingCount / userWords.length;
    if (matchRatio >= 0.8 && normReply.split(' ').length <= userWords.length + 4) {
      if (/^(did you|why did|who|where|what|how|can you|could you|were you)\b/.test(normReply)) {
        return true;
      }
    }
  }

  return false;
}

export function isMetaOrReasoning(text: string): boolean {
  if (!text || text.length < 2) return true;
  const lower = text.toLowerCase().trim();

  const metaPatterns = [
    // Prefixes & meta notes
    /^(also,?\s*)?(note|notice|keep in mind|remember|reminder|context|clarification|hint|disclaimer)[:\s]/i,
    /^(okay|ok|well|so|now|let's|let us|we need to|i need to|i should|i will|here's|here is)\b/i,

    // Third-person character descriptions & personality commentary
    /\b(rook|vale|mina|pip|kira|nox|the character|the npc|the assistant|the speaker|the investigator|the player)\s+(is|was|will|might|should|would|could|must|can|feels|appears|seems|acts|replies|speaks|answers|wants|tends|is being|says)\b/i,
    /\b(he|she|they)\s+(might|should|would|could|must|will|can|is|was|feels|appears|seems|tends|wants)\b/i,
    /\b(personality|traits|occupation|dossier|backstory|system prompt|system instruction|instructions|prompt)\b/i,
    /\b(reluctant|hesitant|unwilling|guarded)\s+to\b/i,

    // Instruction echoes & commentary
    /\b(previous reply|the user|user is asking|user asks|keep it|respond with|respond as|response should|response would|output only|dialogue only|tight and concise|short and concise|1-2 sentences|brief response)\b/i,
    /\b(analysis|reasoning|internal monologue|thinking process|in-character|roleplay|meta)\b/i,
    /\b(according to|based on)\s+(the|my)?\s*(observations|knowledge|prompt|dossier|rules|character)/i,
    /\bas\s+(vale|rook|mina|pip|kira|nox),/i,
    /\bsince\s+(vale|rook|mina|pip|kira|nox)\s+/i,
    /\bthis follows naturally\b/i,
    /\bto answer the (question|user|investigator)\b/i
  ];

  for (const pattern of metaPatterns) {
    if (pattern.test(lower)) {
      return true;
    }
  }

  return false;
}

async function queryModel(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.6,
      max_tokens: 120
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string; code?: number | string; type?: string };
  };

  if (data.error) {
    const errMsg = data.error.message || `Error code: ${data.error.code || 'unknown'}`;
    throw new Error(`Upstream error (${data.error.code}): ${errMsg}`);
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('Received empty response from provider.');
  }

  return reply;
}

export async function handleChatRequest(body: ChatRequestBody): Promise<{ reply: string; isMock?: boolean }> {
  const apiKey = process.env.ANTSEED_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.ANTSEED_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.ANTSEED_MODEL || process.env.OPENAI_MODEL || 'antseed';

  const sanitizedEndpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const context = getGroundedContext(body.characterState, body.userMessage);

  console.log(`[AntSeed Server] Dispatching request to: ${sanitizedEndpoint} | Model: ${model} | Character: ${body.characterState?.name}`);

  // Check if real API credentials are configured
  const isPlaceholderOrMissing = !apiKey || apiKey.includes('your_antseed') || apiKey.trim() === '';

  if (isPlaceholderOrMissing) {
    console.log('[AntSeed Server] No credentials detected in .env; utilizing local mock response.');
    return {
      reply: `[DEV MOCK MODE: AntSeed credentials not configured in .env]\n${context.defaultFallback}`,
      isMock: true
    };
  }

  const systemPrompt = buildSystemPrompt(body.characterState, context.relevantFacts);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...body.history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: body.userMessage }
  ];

  let rawReply = '';
  try {
    rawReply = await queryModel(sanitizedEndpoint, apiKey, model, messages);
  } catch (err: any) {
    console.error(`[AntSeed Server Error] Network/API request failed:`, err.message);
    throw new Error(`Failed to connect to AntSeed at ${sanitizedEndpoint}: ${err.message}`);
  }

  let cleanReply = cleanAndExtractDialogue(rawReply);
  const isInvalid = isMetaOrReasoning(cleanReply) || isQuestionEcho(cleanReply, body.userMessage);

  // Check if response contains meta leakage or question echo
  if (isInvalid) {
    console.warn(`[AntSeed Server Warning] Invalid response detected ("${cleanReply}"). Initiating single retry with strict instruction...`);

    const retryMessages = [
      ...messages,
      { role: 'assistant', content: rawReply },
      {
        role: 'user',
        content: `Return ONLY 1-2 sentences of spoken in-character dialogue answering the question directly. Do NOT repeat or echo the question. Do NOT include notes, analysis, or third-person commentary.`
      }
    ];

    try {
      const retryRaw = await queryModel(sanitizedEndpoint, apiKey, model, retryMessages);
      const retryClean = cleanAndExtractDialogue(retryRaw);
      const retryInvalid = isMetaOrReasoning(retryClean) || isQuestionEcho(retryClean, body.userMessage);

      if (!retryInvalid) {
        console.log(`[AntSeed Server] Retry successful: "${retryClean}"`);
        return { reply: retryClean, isMock: false };
      } else {
        console.warn(`[AntSeed Server Warning] Retry still invalid ("${retryClean}"). Using safe grounded fallback.`);
      }
    } catch (retryErr: any) {
      console.warn(`[AntSeed Server Warning] Retry request failed: ${retryErr.message}. Using safe grounded fallback.`);
    }

    // Safe grounded fallback so meta or echo is NEVER exposed to player
    console.log(`[AntSeed Server] Emitted safe grounded fallback: "${context.defaultFallback}"`);
    return { reply: context.defaultFallback, isMock: false };
  }

  console.log(`[AntSeed Server] Clean response: "${cleanReply}"`);
  return { reply: cleanReply, isMock: false };
}

// Handler for Vercel Serverless Function / Node HTTP
export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    let body: ChatRequestBody;
    if (req.body) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else if (typeof req[Symbol.asyncIterator] === 'function') {
      let rawBody = '';
      for await (const chunk of req) {
        rawBody += chunk;
      }
      body = JSON.parse(rawBody || '{}');
    } else {
      body = {} as any;
    }

    const result = await handleChatRequest(body);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}
