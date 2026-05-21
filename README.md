# EcoPrompt

A privacy-centric, local-first AI chat app that audits your prompts for energy efficiency before sending them to a remote model.

## What it does

**Before you send anything**, EcoPrompt runs your draft prompt through a quantized language model (`all-MiniLM-L6-v2`) running entirely in your browser via WebAssembly. It scores each word by how semantically incoherent it is with its neighbors — a proxy for filler, padding, and context-dump patterns that inflate token counts unnecessarily. Those regions are smoothed with a 1D Gaussian kernel and highlighted inline in the text field.

You then get to either clean up the flagged text or bypass the warning. Whatever you send goes to the **GreenPT API** (OpenAI-compatible endpoint), which returns the response alongside real energy (mWh) and carbon (mg CO₂) telemetry.

The **Impact Dashboard** uses that telemetry to show you counterfactual impact: how much energy you *would* have spent with your original draft vs. what you actually spent after optimizing — cumulative across all your sessions.

## Key features

- **Inline bloat highlighting** — red span overlays over high-perplexity sections, with tooltip explanations
- **Audit-then-send flow** — Enter intercepts and runs the audit first; a "Bypass & Send Anyway" button lets you skip
- **Zero server** — all state lives in `localStorage`; the local model runs entirely in a Web Worker with no data leaving the device until you choose to send
- **Counterfactual dashboard** — bar chart comparing potential vs. actual energy per session, plus cumulative KPI cards for energy used, energy prevented, and CO₂ avoided
- **Chat history** — previous conversations listed in the sidebar, with inline message editing

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v3 |
| Local inference | `@xenova/transformers` (WASM) |
| Remote AI | GreenPT API (`api.greenpt.ai/v1`) |
| Charts | Recharts |
| Persistence | `localStorage` |

## Getting started

```bash
npm install
npm run dev
```

On first launch, click **API Key** in the bottom-left sidebar to paste your GreenPT API key. It's stored only in `localStorage`.

## How the audit works

1. Your draft is tokenized word-by-word and each token is embedded using the local model.
2. Each token gets a cosine-distance score against its context window — higher = more incoherent/filler-like.
3. Scores are smoothed with a 1D Gaussian kernel (radius 2, σ 1.2) to merge adjacent noisy tokens into coherent spans.
4. Any span where the smoothed score exceeds the threshold (α = 0.35) is marked as a bloat region.
5. Character offsets for those spans are mapped back to the textarea and rendered as inline highlights.

## Counterfactual math

After a response arrives, EcoPrompt computes what you *would* have spent without editing:

```
E_pot = E_act × (P_orig + T_out) / (P_opt + T_out)
ΔE    = E_pot − E_act
```

Where `P_orig` is the original draft token count, `P_opt` is the optimized count, and `T_out` is the output token count. The same ratio applies to CO₂.
