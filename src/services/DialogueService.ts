import { CharacterState } from '../types/characterState';

export interface DialogueResponse {
  success: boolean;
  reply: string;
  error?: string;
  isMock?: boolean;
}

export class DialogueService {
  public static async askCharacter(
    state: CharacterState,
    userMessage: string,
    signal?: AbortSignal
  ): Promise<DialogueResponse> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          characterState: state,
          userMessage: userMessage,
          history: state.conversationHistory
        }),
        signal: signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          reply: '',
          error: errData.error || `HTTP ${response.status}`
        };
      }

      const data = await response.json();
      const replyText = (data.reply || '').trim();

      return {
        success: true,
        reply: replyText,
        isMock: data.isMock
      };
    } catch (err: any) {
      return {
        success: false,
        reply: '',
        error: err.name === 'AbortError' ? 'Request aborted' : err.message
      };
    }
  }
}
