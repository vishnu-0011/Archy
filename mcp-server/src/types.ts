// Represents a single element in a diagram, assigned to a layer
export interface DiagramElement {
  id: string;
  label: string;
  type: string; // e.g., 'component', 'service', etc.
  layer: string; // Layer name or identifier
  [key: string]: any; // Additional properties as needed
}

export interface NodeDetail {
  id: string;
  label: string;
  description: string;
  technologies?: string[];
  relatedComponents?: string[];
}

// Represents a diagram grouped by layers
export interface LayeredDiagram {
  layers: Record<string, DiagramElement[]>; // key: layer name, value: elements in that layer
}
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
  diagramImageUrl?: string; // New: Rendered image URL
  isError?: boolean;
}

export interface GenerateArchitectureResponse {
  explanation: string;
  mermaidCode: string;
  diagramImageUrl?: string;
  nodeDescriptions?: Record<string, string>;
  theme?: string;
  designRationale?: string;
}

export interface DiagramState {
  code: string;
  isValid: boolean;
  error?: string;
}

export interface DiagramVersion {
  id: string;
  code: string;
  timestamp: number;
  prompt: string;
  nodeDescriptions?: Record<string, string>;
}