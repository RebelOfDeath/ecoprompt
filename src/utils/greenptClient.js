// In dev, Vite proxies /api/greenpt → https://api.greenpt.ai/v1 (avoids CORS).
// Set VITE_GREENPT_BASE in production to point at your own proxy.
const GREENPT_BASE = import.meta.env.VITE_GREENPT_BASE ?? '/api/greenpt'
// GreenPT hosts its own models — OpenAI model names are not valid here.
// GreenL tier: mistral-small-3.2-24b-instruct-2506
// GreenR tier: check https://docs.greenpt.ai/api/models for the 120B model ID
const DEFAULT_MODEL = 'mistral-small-3.2-24b-instruct-2506'

function getApiKey() {
  return localStorage.getItem('ecoprompt_api_key') || ''
}

/**
 * Sends a chat completion request to GreenPT's OpenAI-compatible API.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} opts
 * @returns {Promise<{text: string, usage: object, energy: object}>}
 */
export async function sendChatCompletion(messages, opts = {}) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('GreenPT API key not set. Add it in Settings.')

  const body = {
    model: opts.model || DEFAULT_MODEL,
    messages,
    stream: false,
    ...opts,
  }

  const res = await fetch(`${GREENPT_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`GreenPT API error ${res.status}: ${errText}`)
  }

  const json = await res.json()

  const text = json.choices?.[0]?.message?.content ?? ''
  const usage = json.usage ?? {}
  const impact = json.impact ?? {}

  // GreenPT returns energy in Watt-milliseconds (Wms) and emissions in µg CO₂e.
  // Convert: Wms → mWh (÷ 3,600,000), µg CO₂e → mg CO₂e (÷ 1000).
  const rawWms = impact.energy?.total ?? null
  const rawUgCo2 = impact.emissions?.total ?? null
  const inputTokens = usage.prompt_tokens ?? 0
  const outputTokens = usage.completion_tokens ?? 0

  const energy = {
    energyMWh: rawWms != null
      ? rawWms / 3_600_000
      : (inputTokens + outputTokens) * 0.0003,
    co2Mg: rawUgCo2 != null
      ? rawUgCo2 / 1000
      : (inputTokens + outputTokens) * 0.00012,
    inputTokens,
    outputTokens,
  }

  return { text, usage, energy }
}
