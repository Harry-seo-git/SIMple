export type AIModel = "claude" | "openai" | "gemini";

export type OutputFormat = "svg" | "png" | "pdf";

export type GenerationStatus = "idle" | "generating" | "done" | "error";

export interface AIModelConfig {
  id: AIModel;
  name: string;
  description: string;
  icon: string;
  capabilities: string[];
  outputFormats: OutputFormat[];
}

export interface GeneratedAsset {
  id: string;
  prompt: string;
  model: AIModel;
  format: OutputFormat;
  url: string;
  svgCode?: string;
  createdAt: string;
  tags: string[];
  width: number;
  height: number;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  prompt_modifier: string;
}

// ── Brand Guideline System ──

export type GuidelineCategory =
  | "color"
  | "shape"
  | "typography"
  | "composition"
  | "mood"
  | "constraint"
  | "custom";

export interface BrandGuideline {
  id: string;
  category: GuidelineCategory;
  title: string;
  directive: string; // AI에게 전달되는 실제 지침
  enabled: boolean;
  createdAt: string;
}

export interface BrandProfile {
  id: string;
  name: string;
  description: string;
  guidelines: BrandGuideline[];
  createdAt: string;
  updatedAt: string;
}

// ── Settings / Connections ──

export type ConnectionStatus = "connected" | "disconnected" | "error";
export type AuthMethod = "api_key" | "oauth";

export interface AIProviderConnection {
  provider: AIModel;
  authMethod: AuthMethod;
  status: ConnectionStatus;
  apiKey?: string;          // masked for display
  oauthUserName?: string;   // OAuth 연결 시 사용자 이름
  oauthEmail?: string;      // OAuth 연결 시 이메일
  lastVerified?: string;
  error?: string;
}

export interface FigmaConnection {
  status: ConnectionStatus;
  authMethod: "oauth";
  accessToken?: string;
  userName?: string;
  userAvatar?: string;
  teamName?: string;
  lastConnected?: string;
  error?: string;
}

export interface AppSettings {
  aiProviders: Record<AIModel, AIProviderConnection>;
  figma: FigmaConnection;
  defaults: {
    model: AIModel;
    outputFormat: OutputFormat;
  };
}

export interface GenerationRequest {
  model: AIModel;
  prompt: string;
  style?: string;
  outputFormat: OutputFormat;
  brandGuidelines?: BrandGuideline[];
  width?: number;
  height?: number;
}

