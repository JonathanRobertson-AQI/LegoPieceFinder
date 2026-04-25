import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';

export interface GeminiResult {
  found: boolean;
  /** Bounding box [ymin, xmin, ymax, xmax] normalized 0-1000 */
  box: [number, number, number, number] | null;
  message?: string;
}

const PROMPT = `You are an expert LEGO piece identification assistant with deep knowledge of LEGO parts.

Image 1 is the TARGET: a specific LEGO piece the user wants to find. Study it carefully:
- Exact color (be precise: e.g. "bright red", "dark bluish gray", not just "gray")
- Shape and form (brick, plate, slope, technic, tile, etc.)
- Stud count and arrangement (e.g. 2x4, 1x2, 2x2 round)
- Any unique features (clips, holes, slopes, curves, hinges, etc.)
- Approximate size relative to other pieces

Image 2 is the COLLECTION: a pile or group of many LEGO pieces. Search it thoroughly for a piece that EXACTLY matches ALL the characteristics you identified from Image 1. Do not settle for a similar piece — it must be the same color, shape, and size.

Respond with ONLY a valid JSON object -- no markdown, no extra text.

If an exact match is found:
{"found": true, "box": [ymin, xmin, ymax, xmax]}

Coordinates are integers 0-1000 (normalized to image dimensions). Make the bounding box tight around the matching piece only.

If no exact match exists in Image 2:
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
