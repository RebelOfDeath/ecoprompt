import { useEffect, useRef, useState, useCallback } from 'react'
import { gaussianSmooth, extractSpans, mergeNearbySpans, filterShortSpans } from '../utils/gaussianBlur'

const ALPHA = 0.35
const GAUSSIAN_K = 3
const GAUSSIAN_SIGMA = 1.8
const MERGE_GAP = 5    // tokens — spans closer than this are joined
const MIN_SPAN_TOKENS = 2

export function useAuditWorker() {
  const workerRef = useRef(null)
  const [modelStatus, setModelStatus] = useState('idle') // idle | loading | ready | error
  const pendingRef = useRef(null)

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/auditWorker.js', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = ({ data }) => {
      if (data.type === 'status') {
        setModelStatus(data.message === 'Model ready' ? 'ready' : 'loading')
      } else if (data.type === 'pong') {
        setModelStatus('ready')
      } else if (data.type === 'result') {
        if (pendingRef.current) {
          const { resolve } = pendingRef.current
          pendingRef.current = null
          resolve(data.scored)
        }
      } else if (data.type === 'error') {
        setModelStatus('error')
        if (pendingRef.current) {
          const { reject } = pendingRef.current
          pendingRef.current = null
          reject(new Error(data.message))
        }
      }
    }

    worker.onerror = (e) => {
      setModelStatus('error')
      console.error('Audit worker error:', e)
    }

    workerRef.current = worker
    setModelStatus('loading')
    worker.postMessage({ type: 'ping' })

    return () => worker.terminate()
  }, [])

  const auditText = useCallback(
    (text) =>
      new Promise((resolve, reject) => {
        if (!workerRef.current) return reject(new Error('Worker not ready'))
        pendingRef.current = { resolve, reject }
        workerRef.current.postMessage({ type: 'audit', text })
      }),
    [],
  )

  /**
   * Full pipeline: audit text → smooth → extract spans → map to char ranges.
   * Returns array of {charStart, charEnd, advice} objects.
   */
  /**
   * Returns { spans, score } where score is 0–100 (higher = cleaner prompt).
   */
  const getHighlightSpans = useCallback(
    async (text) => {
      const scored = await auditText(text)
      if (!scored || scored.length === 0) return { spans: [], score: 100 }

      const rawScores = scored.map(t => t.score)
      const smoothed = gaussianSmooth(rawScores, GAUSSIAN_K, GAUSSIAN_SIGMA)
      const rawSpans = extractSpans(smoothed, ALPHA)
      const tokenSpans = mergeNearbySpans(filterShortSpans(rawSpans, smoothed, MIN_SPAN_TOKENS), MERGE_GAP)

      const avgSmoothed = Array.from(smoothed).reduce((a, b) => a + b, 0) / smoothed.length
      const score = Math.round(Math.max(0, Math.min(100, (1 - avgSmoothed) * 100)))

      const spans = tokenSpans.map(({ start, end }) => ({
        charStart: scored[start].charStart,
        charEnd: scored[end].charEnd,
        advice:
          'This section contains high structural padding or context-dump patterns. Consolidate to save energy.',
      }))

      return { spans, score }
    },
    [auditText],
  )

  return { modelStatus, getHighlightSpans }
}
