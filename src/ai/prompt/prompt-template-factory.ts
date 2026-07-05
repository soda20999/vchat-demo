export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  defaultParams: {
    temperature: number;
    topP: number;
    maxTokens: number;
  };
}

export interface PromptTemplateConfig {
  id: string;
  name: string;
  role: string;
  task: string;
  systemPrompt?: string;
  defaultParams: PromptTemplate['defaultParams'];
}

export function createPromptTemplate(config: PromptTemplateConfig): PromptTemplate {
  return {
    id: config.id,
    name: config.name,
    systemPrompt: config.systemPrompt ?? `You are a ${config.role}. ${config.task}`,
    defaultParams: config.defaultParams,
  };
}
