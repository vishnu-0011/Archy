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
  nodeDetails?: NodeDetail[];
  isError?: boolean;
}

export interface NodeDetail {
  id: string;
  label: string;
  description: string;
  technologies: string[];
  relatedComponents: string[];
}

export interface GenerateArchitectureResponse {
  explanation: string;
  mermaidCode: string;
  nodeDetails: NodeDetail[];
}

export interface DiagramState {
  code: string;
  isValid: boolean;
  error?: string;
}

export interface DiagramVersion {
  id: string;
  code: string;
  nodeDetails: NodeDetail[];
  timestamp: number;
  prompt: string;
}

export interface GitHubConfig {
  token?: string;
}

export interface RepositoryMetadata {
  owner: string;
  repo: string;
  description?: string;
  stars?: number;
  forks?: number;
  topLanguages?: string;
}