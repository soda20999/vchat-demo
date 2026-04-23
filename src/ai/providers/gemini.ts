import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AIProvider } from '../interface';

type GeminiGenerationConfig = {
  responseMimeType?: 'application/json';
  responseSchema?: object;
};

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string = process.env.GEMINI_API_KEY || '') {
    if (!apiKey) {
      throw new Error('Gemini API key is missing. Set GEMINI_API_KEY in .env');
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  private async imageToGenerativePart(imageUrl: string): Promise<Part | null> {
    try {
      if (imageUrl.startsWith('data:image/')) {
        const [mimeTypePart, base64Data] = imageUrl.substring(5).split(';base64,');
        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeTypePart,
          },
        };
      }

      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return {
          fileData: {
            mimeType: this.getMimeType(imageUrl),
            fileUri: imageUrl,
          },
        };
      }

      console.warn('Unsupported image URL format:', imageUrl);
      return null;
    } catch (error) {
      console.error('Image processing error:', error);
      return null;
    }
  }

  private getMimeType(url: string): string {
    if (url.toLowerCase().includes('.webp')) return 'image/webp';
    if (url.toLowerCase().includes('.png')) return 'image/png';
    if (url.toLowerCase().includes('.gif')) return 'image/gif';
    return 'image/jpeg';
  }

  async streamChat(
    userPrompt: string,
    modelName: string = 'gemini-2.0-flash',
    schema?: z.ZodType | null,
    onChunk?: (text: string) => void,
    imageUrl?: string
  ): Promise<{ answer: string }> {
    const generationConfig: GeminiGenerationConfig = {};
    if (schema) {
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = zodToJsonSchema(schema);
    }

    const model = this.client.getGenerativeModel({
      model: modelName,
      generationConfig,
    });

    let contents: string | Part[] = userPrompt;
    if (imageUrl) {
      const imagePart = await this.imageToGenerativePart(imageUrl);
      if (imagePart) {
        contents = [{ text: userPrompt || 'Please describe this image.' }, imagePart];
      }
    }

    const result = await model.generateContentStream(contents);
    let fullResponse = '';

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (!text) continue;

      fullResponse += text;
      onChunk?.(text);
    }

    return { answer: fullResponse };
  }
}
