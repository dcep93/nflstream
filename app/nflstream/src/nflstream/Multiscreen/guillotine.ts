// Probability that each X_i ~ N(μ_i, σ_i^2) is the minimum among independent variables.
// Supports σ_i = 0 (degenerate at μ_i). Returns p[i] for all i.
// Method:
//  - If σ_i = 0: p_i = (1/K) * ∏_{j: σ_j>0} P(X_j ≥ μ_i), where K is # of zero-σ with the same μ_i,
//    provided no zero-σ has mean < μ_i. Else p_i = 0.
//  - If σ_i > 0: use 1-D Gauss–Hermite on ∫ φ(z) Π_{j≠i} [1 - F_j(μ_i + σ_i z)] dz,
//    where for zero-σ competitors F_j(x) = 1{x ≥ μ_j} (indicator).
export function probNormalMinAll(
  mus: number[],
  sigmas: number[],
  points: 20 | 32 = 32
): number[] {
  const n = mus.length;
  if (sigmas.length !== n)
    throw new Error("mus and sigmas must have same length");

  const zeroIdx: number[] = [];
  for (let i = 0; i < n; i++) if (sigmas[i] === 0) zeroIdx.push(i);

  // Precompute zero-σ stats
  let minZeroMu = +Infinity;
  const zeroCountByMu = new Map<number, number>();
  for (const i of zeroIdx) {
    const mu = mus[i];
    minZeroMu = Math.min(minZeroMu, mu);
    zeroCountByMu.set(mu, (zeroCountByMu.get(mu) ?? 0) + 1);
  }

  const out = new Array<number>(n).fill(0);

  // Handle σ_i = 0 exactly
  for (const i of zeroIdx) {
    const mu_i = mus[i];
    // If any zero-σ has strictly smaller mean, this one can never be the minimum.
    if (minZeroMu < mu_i) {
      out[i] = 0;
      continue;
    }
    // Count ties among zero-σ at the same mean
    const K = zeroCountByMu.get(mu_i)!; // >= 1
    // Continuous competitors (σ>0) don't tie at exactly μ_i with positive prob, so only split among degenerate equals.
    // p = (1/K) * Π_{j: σ_j>0} P(X_j ≥ μ_i) = (1/K) * Π SF((μ_i - μ_j)/σ_j)
    let logp = 0;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      if (sigmas[j] === 0) {
        // If another zero-σ has mean < μ_i we already returned 0 above.
        // If mean > μ_i, it cannot beat μ_i (always > μ_i), contributes factor 1.
        // If mean == μ_i, tie-split handled by 1/K.
        continue;
      }
      const t = (mu_i - mus[j]) / sigmas[j];
      const sf = 0.5 * erfc(t / Math.SQRT2); // P(X_j ≥ μ_i)
      if (sf <= 0) {
        logp = -Infinity;
        break;
      }
      logp += Math.log(sf);
    }
    out[i] = Math.exp(logp) / K;
  }

  // If all are degenerate, we're done (prob mass splits among the smallest means)
  if (zeroIdx.length === n) return out;

  // Gauss–Hermite for σ_i > 0
  const { x, w } = points === 20 ? GH20 : GH32;
  const invSqrtPi = 1 / Math.sqrt(Math.PI);
  // For quick rejection: if any zero-σ exist, we must have x < minZeroMu for a contribution.
  const haveZero = zeroIdx.length > 0;

  for (let i = 0; i < n; i++) {
    if (sigmas[i] === 0) continue; // already handled exactly
    const mu_i = mus[i],
      si = sigmas[i];

    let acc = 0;
    for (let k = 0; k < x.length; k++) {
      const z = Math.SQRT2 * x[k];
      const xi = mu_i + si * z;

      // Zero-σ competitors: require xi < μ_j for all of them, else integrand is 0.
      if (haveZero && xi >= minZeroMu) {
        // If xi ≥ minZeroMu, at least one zero-σ with μ = minZeroMu dominates (indicator zero)
        continue;
      }

      // Positive-σ competitors: multiply survival probabilities
      let logProd = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        if (sigmas[j] === 0) {
          // We already enforced xi < minZeroMu. If there exist zero-σ with μ > minZeroMu,
          // they still satisfy xi < μ_j since μ_j >= minZeroMu > xi. So contribute factor 1.
          continue;
        }
        const t = (xi - mus[j]) / sigmas[j];
        const sf = 0.5 * erfc(t / Math.SQRT2); // P(X_j ≥ xi)
        if (sf <= 0) {
          logProd = -Infinity;
          break;
        }
        logProd += Math.log(sf);
      }
      acc += w[k] * Math.exp(logProd);
    }
    out[i] = invSqrtPi * acc;
  }

  // Optional normalization to mitigate tiny quadrature error; comment out if you prefer raw.
  const s = out.reduce((a, b) => a + b, 0);
  if (isFinite(s) && s > 0) {
    for (let i = 0; i < n; i++) out[i] /= s;
  }
  return out;
}

/* ---------- error function / normal helpers ---------- */

// erf/erfc (Abramowitz–Stegun 7.1.26), ~1e-7 abs error
function erf(x: number): number {
  const s = x < 0 ? -1 : 1,
    ax = Math.abs(x);
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return s * y;
}
function erfc(x: number): number {
  return 1 - erf(x);
}

/* ---------- Gauss–Hermite nodes/weights ---------- */
/* For ∫_{-∞}^{∞} e^{-t^2} f(t) dt ≈ Σ w_k f(x_k). */

const GH20 = {
  x: [
    -5.387480890011232, -4.603682449550744, -3.944764040115625,
    -3.347854567383216, -2.788806058428131, -2.254974002089276,
    -1.738537712116586, -1.234076215395323, -0.737473728545394,
    -0.245340708300901, 0.245340708300901, 0.737473728545394, 1.234076215395323,
    1.738537712116586, 2.254974002089276, 2.788806058428131, 3.347854567383216,
    3.944764040115625, 4.603682449550744, 5.387480890011232,
  ],
  w: [
    2.229393645534151e-13, 4.399340992273181e-10, 1.086069370769282e-7,
    7.802556478532064e-6, 2.28338636016354e-4, 3.243773342237862e-3,
    2.481052088746361e-2, 1.090172060200233e-1, 2.866755053628341e-1,
    4.6224366960061e-1, 4.6224366960061e-1, 2.866755053628341e-1,
    1.090172060200233e-1, 2.481052088746361e-2, 3.243773342237862e-3,
    2.28338636016354e-4, 7.802556478532064e-6, 1.086069370769282e-7,
    4.399340992273181e-10, 2.229393645534151e-13,
  ],
} as const;

const GH32 = {
  x: [
    -8.098761871660874, -7.411582531485254, -6.84023730524935, -6.328255351285,
    -5.854095056051308, -5.406654247970127, -4.978040610550178,
    -4.563943277103198, -4.161443803114327, -3.768497146590013,
    -3.383498696030558, -3.005164426216242, -2.63252237270101,
    -2.264892682734132, -1.901736226742004, -1.542653519772359,
    1.542653519772359, 1.901736226742004, 2.264892682734132, 2.63252237270101,
    3.005164426216242, 3.383498696030558, 3.768497146590013, 4.161443803114327,
    4.563943277103198, 4.978040610550178, 5.406654247970127, 5.854095056051308,
    6.328255351285, 6.84023730524935, 7.411582531485254, 8.098761871660874,
  ],
  w: [
    5.561914119362677e-29, 4.887200277204103e-25, 1.659774246416088e-22,
    1.957320639102378e-20, 1.185537204829007e-18, 4.021718402636441e-17,
    8.563877803611838e-16, 1.207113954399699e-14, 1.200846779439216e-13,
    8.582396546488225e-13, 4.529431576096181e-12, 1.773082386192262e-11,
    5.189789705817896e-11, 1.162469064628222e-10, 2.027857745523074e-10,
    2.811644121620263e-10, 2.811644121620263e-10, 2.027857745523074e-10,
    1.162469064628222e-10, 5.189789705817896e-11, 1.773082386192262e-11,
    4.529431576096181e-12, 8.582396546488225e-13, 1.200846779439216e-13,
    1.207113954399699e-14, 8.563877803611838e-16, 4.021718402636441e-17,
    1.185537204829007e-18, 1.957320639102378e-20, 1.659774246416088e-22,
    4.887200277204103e-25, 5.561914119362677e-29,
  ],
} as const;
