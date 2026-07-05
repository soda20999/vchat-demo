import { describe, expect, it } from 'vitest';

import { createPromptTemplate } from './prompt-template-factory';
import { getPromptTemplate } from './prompt-templates';

describe('prompt templates', () => {
  it.each(['role-food', 'role-travel', 'role-emotion', 'role-study'])(
    'provides the frontend role template %s',
    (templateId) => {
      const template = getPromptTemplate(templateId);

      expect(template?.systemPrompt).toBeTruthy();
      expect(template?.defaultParams.temperature).toBeTypeOf('number');
      expect(template?.defaultParams.topP).toBeTypeOf('number');
      expect(template?.defaultParams.maxTokens).toBeTypeOf('number');
    }
  );

  it('creates a full prompt template from a compact config', () => {
    expect(
      createPromptTemplate({
        id: 'role-test',
        name: 'Test Role',
        role: 'test assistant',
        task: 'answer briefly',
        defaultParams: { temperature: 0.2, topP: 0.8, maxTokens: 500 },
      })
    ).toEqual({
      id: 'role-test',
      name: 'Test Role',
      systemPrompt: 'You are a test assistant. answer briefly',
      defaultParams: { temperature: 0.2, topP: 0.8, maxTokens: 500 },
    });
  });

  it('allows special templates to override the generated system prompt', () => {
    expect(
      createPromptTemplate({
        id: 'role-custom',
        name: 'Custom Role',
        role: 'fallback role',
        task: 'fallback task',
        systemPrompt: 'Custom prompt',
        defaultParams: { temperature: 0.2, topP: 0.8, maxTokens: 500 },
      }).systemPrompt
    ).toBe('Custom prompt');
  });
});
