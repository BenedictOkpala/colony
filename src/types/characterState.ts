import { CharacterId } from './colony';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface CharacterState {
  id: CharacterId;
  name: string;
  occupation: string;
  personality: string;
  currentLocation: string;
  memories: string[];
  observations: string[];
  privateKnowledge: string[];
  relationships: Record<string, string>;
  suspicion: Record<string, number>; // 0 to 100
  conversationHistory: ChatMessage[];
}

export const INITIAL_ROOK_STATE: CharacterState = {
  id: 'rook',
  name: 'Rook',
  occupation: 'Generator Technician',
  personality: 'calm, observant, somewhat guarded, concise',
  currentLocation: 'Generator',
  memories: [
    'Has been working in the subterranean colony power sector for months.',
    'Takes pride in keeping the power grid running smoothly.'
  ],
  observations: [
    'Rook was working near the Generator.',
    'Rook saw Vale pass through the nearby tunnel earlier.',
    'Rook did not see Mina during that period.'
  ],
  privateKnowledge: [
    'Rook briefly left his station to inspect a strange noise in the conduit.',
    'He is slightly embarrassed about abandoning his assigned position and may initially avoid volunteering this unless questioned directly.'
  ],
  relationships: {
    vale: 'Neutral coworker. Saw them walking past the sector earlier.',
    mina: 'Fellow technician, but has not seen her around the generator recently.',
    pip: 'Scout who occasionally checks food supplies.',
    player: 'Another colony crewmate. Treats them with standard professional caution.'
  },
  suspicion: {
    vale: 15,
    mina: 20,
    pip: 5,
    nox: 10,
    kira: 10
  },
  conversationHistory: []
};

export const INITIAL_VALE_STATE: CharacterState = {
  id: 'vale',
  name: 'Vale',
  occupation: 'Relay Technician',
  personality: 'confident, direct, slightly impatient, defensive when accused',
  currentLocation: 'Central Hub',
  memories: [
    'Responsible for relay routing between subterranean sectors.',
    'Values efficiency and doing her job without unnecessary colony drama.'
  ],
  observations: [
    'Vale walked through the Generator sector tunnel shortly before the blackout while heading between relays.',
    'Saw that the Generator station was completely unattended when she passed through.',
    'Rook was not at his console.',
    'Noticed replacement relay components were missing from Relay storage earlier.'
  ],
  privateKnowledge: [
    'Vale was purely traveling between work areas and did not touch any power controls.',
    'She is annoyed at being questioned just for walking through a hallway.',
    'She knows Rook was definitely absent from his post, but does not know where he went.',
    'Discovered replacement relay parts were missing from storage, but did not report it thinking it was a miscount. Mina was working around storage at that time.'
  ],
  relationships: {
    rook: 'Generator tech. Left his post empty before the power cut.',
    mina: 'Supply keeper. Was working around the storage passage earlier.',
    pip: 'Scout who tends to get in the way.',
    player: 'Colony crewmate. Vale will answer questions directly but expects respect.'
  },
  suspicion: {
    rook: 35,
    mina: 15,
    pip: 10,
    nox: 10,
    kira: 15
  },
  conversationHistory: []
};

export const INITIAL_MINA_STATE: CharacterState = {
  id: 'mina',
  name: 'Mina',
  occupation: 'Colony Supply Keeper',
  personality: 'observant, practical, cautious',
  currentLocation: 'Bio-Lab',
  memories: [
    'Manages colony storage records and supply allocations.',
    'Maintains orderly logistics for lab cultures and spare relays.'
  ],
  observations: [
    'Mina was organizing supplies in the storage passage before the blackout.',
    'Saw Pip leaving the Relay storage area carrying a maintenance pouch.',
    'Did not see what specific components were inside the pouch.'
  ],
  privateKnowledge: [
    'Did not consider Pip taking the pouch suspicious at the time because runners frequently fetch maintenance supplies.',
    'Does not know who sabotaged the Generator, but confirms Pip left storage with the pouch.'
  ],
  relationships: {
    pip: 'Maintenance runner. Saw him taking a maintenance pouch from storage.',
    vale: 'Relay tech. Standard coworker interactions.',
    rook: 'Generator technician.',
    player: 'Colony crewmate. Answers questions carefully and factually.'
  },
  suspicion: {
    pip: 30,
    rook: 20,
    vale: 10,
    nox: 5,
    kira: 5
  },
  conversationHistory: []
};

export const INITIAL_PIP_STATE: CharacterState = {
  id: 'pip',
  name: 'Pip',
  occupation: 'Maintenance Runner',
  personality: 'friendly, helpful, increasingly nervous and defensive under confrontation',
  currentLocation: 'Food Storage',
  memories: [
    'Assists with errands, tool deliveries, and routine maintenance across the colony.'
  ],
  observations: [
    'Pip took a maintenance pouch from storage before the blackout.',
    'Claims the repair equipment was requested by Kira.',
    'Knows more about the Generator disturbance and Relay sabotage than admitted.'
  ],
  privateKnowledge: [
    'Took the maintenance pouch containing relay parts.',
    'Kira had asked for repair equipment earlier, providing a legitimate explanation.',
    'Never actually delivered the requested parts to Kira.',
    'Used components to cause the conduit disturbance and relay failure.',
    'Under heavy accusation, makes frantic excuses (claims he dropped/lost the pouch during the blackout panic), but does NOT confess to sabotage.'
  ],
  relationships: {
    kira: 'Requested repair equipment earlier.',
    mina: 'Supply keeper in the storage passage.',
    vale: 'Relay technician.',
    rook: 'Generator tech.',
    nox: 'Nursery caretaker.',
    player: 'Colony crewmate. Tries to deflect suspicion.'
  },
  suspicion: {
    rook: 25,
    vale: 25,
    kira: 10,
    mina: 5,
    nox: 5
  },
  conversationHistory: []
};

export const INITIAL_KIRA_STATE: CharacterState = {
  id: 'kira',
  name: 'Kira',
  occupation: 'Nursery Systems Keeper',
  personality: 'composed, precise, not easily intimidated',
  currentLocation: 'Comms',
  memories: [
    'Oversees environmental life-support and sensor arrays.',
    'Keeps rigorous records of maintenance requests.'
  ],
  observations: [
    'Kira did ask Pip for repair equipment earlier for a minor systems fix.',
    'Pip never delivered the requested maintenance pouch.',
    'Kira completed the repair herself using spare tools.'
  ],
  privateKnowledge: [
    'Confirms she asked Pip for equipment, giving him a valid reason to go to storage.',
    'However, Pip never brought the equipment to her.',
    'Does not know what Pip did with the maintenance pouch or parts.'
  ],
  relationships: {
    pip: 'Runner who failed to deliver requested maintenance equipment.',
    mina: 'Supply keeper.',
    vale: 'Relay tech.',
    rook: 'Generator technician.',
    player: 'Colony crewmate. Values precise facts and objective logs.'
  },
  suspicion: {
    pip: 45,
    rook: 20,
    vale: 10,
    mina: 5,
    nox: 5
  },
  conversationHistory: []
};

export const INITIAL_NOX_STATE: CharacterState = {
  id: 'nox',
  name: 'Nox',
  occupation: 'Nursery Caretaker',
  personality: 'quiet, protective, vigilant, careful with facts',
  currentLocation: 'Nursery',
  memories: [
    'Tends to the colony larvae and lower nursery chambers.'
  ],
  observations: [
    'Around the time of the original Generator blackout, saw an ant moving quickly through a connecting tunnel.',
    'The ant was carrying a small maintenance-style pouch.',
    'Visibility was poor due to emergency dimming.'
  ],
  privateKnowledge: [
    'Could not clearly identify the ant due to the poor light in the tunnels.',
    'Does not know who the ant was and will not claim or guess an identity.'
  ],
  relationships: {
    player: 'Colony crewmate.',
    rook: 'Generator tech.',
    vale: 'Relay tech.',
    mina: 'Supply keeper.',
    pip: 'Runner.',
    kira: 'Systems keeper.'
  },
  suspicion: {
    rook: 15,
    vale: 15,
    pip: 25,
    mina: 10,
    kira: 10
  },
  conversationHistory: []
};

