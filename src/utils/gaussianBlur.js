/**
 * Builds a normalized 1D Gaussian kernel of radius k and std σ.
 */
export function buildGaussianKernel(k, sigma) {
  const weights = []
  let sum = 0
  for (let j = -k; j <= k; j++) {
    const w = Math.exp(-(j * j) / (2 * sigma * sigma))
    weights.push(w)
    sum += w
  }
  return weights.map(w => w / sum)
}

/**
 * Applies the 1D Gaussian kernel across a scores array.
 * Returns a new smoothed array of the same length.
 */
export function gaussianSmooth(scores, k = 3, sigma = 1.5) {
  const kernel = buildGaussianKernel(k, sigma)
  const n = scores.length
  const smoothed = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let acc = 0
    for (let j = -k; j <= k; j++) {
      const idx = Math.min(Math.max(i + j, 0), n - 1)
      acc += kernel[j + k] * scores[idx]
    }
    smoothed[i] = acc
  }
  return smoothed
}

/**
 * Merges consecutive token indices where score > alpha into spans.
 * Returns array of {start, end} token-index spans (inclusive).
 */
export function extractSpans(smoothedScores, alpha) {
  const spans = []
  let inSpan = false
  let spanStart = 0
  for (let i = 0; i < smoothedScores.length; i++) {
    if (smoothedScores[i] > alpha && !inSpan) {
      inSpan = true
      spanStart = i
    } else if (smoothedScores[i] <= alpha && inSpan) {
      spans.push({ start: spanStart, end: i - 1 })
      inSpan = false
    }
  }
  if (inSpan) spans.push({ start: spanStart, end: smoothedScores.length - 1 })
  return spans
}

/**
 * Merges spans whose gap is <= maxGap tokens — prevents adjacent flagged
 * words from appearing as separate micro-regions.
 */
export function mergeNearbySpans(spans, maxGap = 3) {
  if (spans.length < 2) return spans
  const merged = [{ ...spans[0] }]
  for (let i = 1; i < spans.length; i++) {
    const last = merged[merged.length - 1]
    if (spans[i].start - last.end - 1 <= maxGap) {
      last.end = spans[i].end
    } else {
      merged.push({ ...spans[i] })
    }
  }
  return merged
}

/**
 * Drops spans shorter than minTokens unless their peak smoothed score
 * clears highThreshold — filters single-token noise hits.
 */
export function filterShortSpans(spans, smoothedScores, minTokens = 2, highThreshold = 0.6) {
  return spans.filter(({ start, end }) => {
    const len = end - start + 1
    if (len >= minTokens) return true
    let peak = 0
    for (let i = start; i <= end; i++) peak = Math.max(peak, smoothedScores[i])
    return peak >= highThreshold
  })
}
