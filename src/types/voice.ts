export type VoiceStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'error';

export interface AudioChunk {
  data: string;
  mimeType: string;
}
