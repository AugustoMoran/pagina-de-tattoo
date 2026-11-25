/**
 * providers/gemini.js — Google Gemini AI Provider
 *
 * DEFAULT provider. FREE tier limits (as of 2025):
 *   - gemini-2.0-flash-lite: 30 RPM, 1,500 RPD, 1M TPM  ← cheapest / fastest
 *   - gemini-1.5-flash:      15 RPM, 1,500 RPD, 1M TPM  ← higher quality
 *
 * Get your free API key: https://aistudio.google.com/app/apikey
 *
 * DESIGN DECISION: Uses Node's built-in `https` module — no extra dependencies.
 * The function signature is standardised: generateResponse(prompt, context, apiKey)
 * so any provider can be swapped in without changing callers.
 */

const https = require('https');

const API_HOST = 'generativelanguage.googleapis.com';
// Prefer current free-tier models; try fallbacks if one is retired
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
].filter(Boolean);

/**
 * Generates a text response using the Gemini API.
 *
 * @param {string} prompt   - Full prompt (system + user message)
 * @param {Object} context  - Optional: { model }
 * @param {string} apiKey   - Gemini API key
 * @returns {Promise<string>} AI response text
 */
async function generateResponse(prompt, context = {}, apiKey) {
  if (!apiKey) {
    throw new Error(
      '[Gemini] API key is missing. Get a free key at https://aistudio.google.com/app/apikey and set GEMINI_API_KEY in your .env'
    );
  }

  const models = context.model
    ? [context.model, ...MODEL_CANDIDATES.filter((m) => m !== context.model)]
    : MODEL_CANDIDATES;

  let lastError;
  for (const model of models) {
    try {
      return await callGemini(model, prompt, apiKey);
    } catch (err) {
      lastError = err;
      const msg = String(err.message || '');
      // Retry on retired/missing model
      if (/404|no longer available|not found|NOT_FOUND/i.test(msg)) {
        console.warn(`[Gemini] model ${model} failed, trying next…`, msg.slice(0, 120));
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('[Gemini] No working model');
}

function callGemini(model, prompt, apiKey) {
  const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 300,
      topP: 0.8,
      topK: 40,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path,
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);

            if (res.statusCode !== 200) {
              const msg = parsed?.error?.message || raw.slice(0, 200);
              reject(new Error(`[Gemini] HTTP ${res.statusCode}: ${msg}`));
              return;
            }

            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
              const reason = parsed?.candidates?.[0]?.finishReason || 'unknown';
              reject(new Error(`[Gemini] Empty response. finishReason: ${reason}`));
              return;
            }

            resolve(text.trim());
          } catch (e) {
            reject(new Error(`[Gemini] Failed to parse response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', (e) => reject(new Error(`[Gemini] Network error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

module.exports = { generateResponse };
