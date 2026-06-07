export interface TranslateRequest {
  text: string;
  max_new_tokens?: number;
  temperature?: number;
  top_p?: number;
  system_prompt?: string;
}

export interface TranslateResponse {
  input_text: string;
  gen_z_text: string;
  model: string;
  tokens_generated: number;
}

export interface PresetPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  emoji: string;
}
