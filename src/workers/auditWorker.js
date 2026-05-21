// Pure-JS heuristic audit worker — no ONNX/WASM dependency.
// Scores each word token 0–1 based on filler patterns, hedge phrases,
// local repetition, and verbose qualifier chains. The output is fed into
// the same Gaussian smoothing + span extraction pipeline as before.

const FILLER_WORDS = new Set([
  'please','kindly','basically','essentially','literally','actually',
  'honestly','frankly','simply','just','really','very','quite','rather',
  'somewhat','sort','kind','well','so','like','okay','alright','um','uh',
  'right','yeah','yes','indeed','certainly','absolutely','definitely',
  'obviously','clearly','truly','surely','totally','completely','entirely',
  'merely','only','even','still','already','yet','ever','never','always',
])

const HIGH_FILLER_BIGRAMS = new Set([
  'go ahead','ahead and','feel free','in order','order to',
  'could you','would you','can you','may you',
  'i want','want you','i need','need you',
  'i would','would like','would love',
  'i was','was wondering',
  'please go','please help','please provide','please make',
  'kindly provide','kindly help',
  'as a','a matter','matter of','of fact',
  'due to','to the','the fact','fact that',
  'at this','this point','point in','in time',
  'in the','the event','event that',
  'for the','the purpose','purpose of',
  'it is','is important','is necessary','is worth',
])

function tokenize(text) {
  const tokens = []
  const re = /\S+/g
  let m
  while ((m = re.exec(text)) !== null) {
    tokens.push({ token: m[0].replace(/[^a-zA-Z0-9']/g, '').toLowerCase(), raw: m[0], charStart: m.index, charEnd: m.index + m[0].length })
  }
  return tokens
}

function scoreTokens(tokens) {
  const scores = new Array(tokens.length).fill(0)
  const WINDOW = 6

  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i].token
    let score = 0

    // Filler word hit
    if (FILLER_WORDS.has(w)) score = Math.max(score, 0.72)

    // Bigram check with previous token
    if (i > 0) {
      const bigram = `${tokens[i - 1].token} ${w}`
      if (HIGH_FILLER_BIGRAMS.has(bigram)) {
        score = Math.max(score, 0.85)
        scores[i - 1] = Math.max(scores[i - 1], 0.85)
      }
    }

    // Local repetition: same word used in recent window
    if (w.length > 3) {
      const lo = Math.max(0, i - WINDOW)
      for (let j = lo; j < i; j++) {
        if (tokens[j].token === w) {
          score = Math.max(score, 0.65)
          break
        }
      }
    }

    // Hedge opener: sentence starts with a filler-heavy construct
    const raw = tokens[i].raw
    if (i === 0 && FILLER_WORDS.has(w)) score = Math.max(score, 0.8)

    // Very short throwaway words at sentence boundaries
    if (w.length <= 2 && !['i', 'a'].includes(w)) score = Math.max(score, 0.1)

    scores[i] = score
  }

  return scores
}

self.onmessage = ({ data }) => {
  if (data.type === 'ping') {
    // No model to load — ready immediately
    self.postMessage({ type: 'status', message: 'Model ready' })
    self.postMessage({ type: 'pong' })
    return
  }

  if (data.type === 'audit') {
    try {
      const tokens = tokenize(data.text)
      const rawScores = scoreTokens(tokens)
      const scored = tokens.map((t, i) => ({
        token: t.raw,
        charStart: t.charStart,
        charEnd: t.charEnd,
        score: rawScores[i],
      }))
      self.postMessage({ type: 'result', scored })
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message })
    }
  }
}
