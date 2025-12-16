export enum Sender {
  USER = 'user',
  AI = 'ai'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  diagramCode?: string; // If the message contains a diagram
  isError?: boolean;
}

export interface GenerateArchitectureResponse {
  explanation: string;
  mermaidCode: string;
}

export interface DiagramState {
  code: string;
  isValid: boolean;
  error?: string;
}