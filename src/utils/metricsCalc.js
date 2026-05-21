/**
 * Computes counterfactual impact metrics from GreenPT response data.
 *
 * @param {number} pOrig  - original (unoptimized) token count
 * @param {number} pOpt   - optimized token count sent to API
 * @param {number} tOut   - output tokens generated
 * @param {number} eAct   - actual energy used (mWh) from API
 * @param {number} cAct   - actual CO₂ emissions (mg) from API
 */
export function computeCounterfactual(pOrig, pOpt, tOut, eAct, cAct) {
  const ratio = pOrig + tOut > 0 ? (pOrig + tOut) / (pOpt + tOut) : 1
  const ePot = eAct * ratio
  const cPot = cAct * ratio
  return {
    energyUsedMWh: eAct,
    co2EmissionsMg: cAct,
    energySavedMWh: Math.max(0, ePot - eAct),
    co2SavedMg: Math.max(0, cPot - cAct),
  }
}

/**
 * Estimates energy/CO₂ from token counts when the API doesn't return telemetry.
 * Uses approximate GreenPT averages: ~0.0003 mWh/token, ~0.12 mg CO₂/token.
 */
export function estimateMetrics(inputTokens, outputTokens) {
  const totalTokens = inputTokens + outputTokens
  return {
    energyUsedMWh: totalTokens * 0.0003,
    co2EmissionsMg: totalTokens * 0.00012,
  }
}
