// p_i = ∫ φ(z) Π_{j≠i} [1 - Φ((μ_i + σ_i z - μ_j)/σ_j)] dz
// Assumes all sigmas[j] > 0.
export function probNormalMinAll(
  mus: number[],
  sigmas: number[],
  points: 20 = 20
): number[] {
  const n = mus.length;
  if (sigmas.length !== n) throw new Error("mus and sigmas length mismatch");
  if (n === 0) return [];
  if (n === 1) return [1];
  for (const s of sigmas) if (!(s > 0)) throw new Error("all σ must be > 0");

  const { x, w } = GH20; // 20-point GH only (robust + compact)
  const scale = Math.SQRT2; // z = √2 y
  const normFactor = 1 / Math.sqrt(Math.PI); // ∫φ = (1/√π) Σ w_k f(√2 x_k)

  const Phi = (t: number): number => 0.5 * (1 + erf(t / Math.SQRT2));
  const log1m = (p: number): number => {
    if (p <= 0) return 0; // log(1)
    if (p >= 1) return -Infinity; // log(0)
    return Math.log1p(-p);
  };

  const out = new Array<number>(n).fill(0);

  for (let i = 0; i < n; i++) {
    const mui = mus[i],
      si = sigmas[i];
    let acc = 0;

    for (let k = 0; k < x.length; k++) {
      const z = scale * x[k];
      const xi = mui + si * z;

      // log Π_{j≠i} (1 - Φ((xi - μ_j)/σ_j))
      let logProd = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const t = (xi - mus[j]) / sigmas[j];
        logProd += log1m(Phi(t));
      }
      acc += w[k] * Math.exp(logProd);
    }
    out[i] = normFactor * acc;
  }

  // normalize (handles small quadrature drift)
  const s = out.reduce((a, b) => a + b, 0);
  for (let i = 0; i < n; i++) out[i] = out[i] / s;
  return out;
}

/* ---------- utils ---------- */

function erf(x: number): number {
  // Abramowitz–Stegun 7.1.26
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

/* ---------- Gauss–Hermite n=20 (weight e^{-x^2}) ---------- */
const GH20 = {
  x: [
    -5.387480890011232, -4.603682449550744, -3.944764040115625,
    -3.347854567383216, -2.78880605842813, -2.254974002089276,
    -1.738537712116586, -1.234076215395323, -0.737473728545394,
    -0.245340708300901, 0.245340708300901, 0.737473728545394, 1.234076215395323,
    1.738537712116586, 2.254974002089276, 2.78880605842813, 3.347854567383216,
    3.944764040115625, 4.603682449550744, 5.387480890011232,
  ],
  w: [
    2.229393645534151e-13, 4.39934099227318e-10, 1.086069370769281e-7,
    7.802556478532063e-6, 2.28338636016353e-4, 3.243773342237861e-3,
    2.481052088746359e-2, 1.090172060201, 2.866755053628341e-1,
    4.622436696006101e-1, 4.622436696006101e-1, 2.866755053628341e-1,
    1.090172060201, 2.481052088746359e-2, 3.243773342237861e-3,
    2.28338636016353e-4, 7.802556478532063e-6, 1.086069370769281e-7,
    4.39934099227318e-10, 2.229393645534151e-13,
  ],
} as const;
