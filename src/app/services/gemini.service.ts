import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';

export interface GeminiResult {
  found: boolean;
  /** Bounding box [ymin, xmin, ymax, xmax] normalized 0-1000 */
  box: [number, number, number, number] | null;
  message?: string;
}

const PROMPT = `You are a LEGO piece identification assistant.
Image 1 shows a specific LEGO piece to find.
Image 2 shows a collection or pile of LEGO pieces.

Find the LEGO piece from Image 1 inside the pile in Image 2.
Respond with ONLY a valid JSON object -- no markdown, no extra text.

If found:
{"found": true, "box": [ymin, xmin, ymax, xmax]}

Coordinates are integers 0-1000 (normalized to image dimensions).

If not found:
{"found": false, "box": null}`;

const MODEL = 'gemini-2.5-flash';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private genAI = new GoogleGenerativeAI(environment.geminiApiKey);

  async findPiece(
    targetBase64: string,
    collectionBase64: string,
    targetMime = 'image/jpeg',
    collectionMime = 'image/jpeg'
  ): Promise<GeminiResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: MODEL });
      const response = await model.generateContent([
        { inlineData: { mimeType: targetMime as 'image/jpeg', data: targetBase64 } },
        { inlineData: { mimeType: collectionMime as 'image/jpeg', data: collectionBase64 } },
        PROMPT,
      ]);
      const raw = response.response.text().trim();
      const json = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(json) as GeminiResult;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Gemini error:', err);
      return { found: false, box: null, message: this.friendlyError(msg) };
    }
  }

  /** Quick text-only ping to verify the API key. */
  async testKey(): Promise<{ ok: boolean; error?: string }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: MODEL });
      await model.generateContent('Reply with just the word OK.');
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { ok: false, error: this.friendlyError(msg) };
    }
  }

  private friendlyError(raw: string): string {
    if (raw.includes('quota') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
      return 'The AI is busy right now. Please wait a minute and try again! ⏳';
    }
    if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid')) {
      return 'The API key is not valid. Please check src/environments/environment.ts.';
    }
    if (raw.includes('404') || raw.includes('NOT_FOUND')) {
      return 'Could not reach the AI service. Please check your API key has Gemini access.';
    }
    return 'Something went wrong. Please try again!';
  }
}
