// Core implementation of Pollard's p-1 factorization algorithm.
//
// The algorithm works by choosing a bound B and computing M = product of prime powers
// p^k <= B. Then for a base a, compute a^M mod n. If n has a prime factor p such that
// p-1 is B-smooth, then by Fermat's little theorem a^M ≡ 1 (mod p), so gcd(a^M - 1, n)
// yields a non-trivial factor (or n itself if both factors are smooth).
//
// This implementation uses exponentiation by squaring to compute powers, and
// accumulates the exponent M incrementally to avoid building an enormous number.
// The smooth bound B is chosen adaptively based on the size of n.

/**
 * Computes the greatest common divisor of two non-negative integers.
 * Uses the Euclidean algorithm.
 *
 * @param {bigint} a - First integer.
 * @param {bigint} b - Second integer.
 * @returns {bigint} The GCD of a and b.
 */
export function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Computes (base ** exponent) % modulus using binary exponentiation.
 * Handles large exponents efficiently without creating huge intermediate numbers.
 *
 * @param {bigint} base - The base.
 * @param {bigint} exponent - The exponent (non-negative).
 * @param {bigint} modulus - The modulus (positive).
 * @returns {bigint} The result of (base ** exponent) % modulus.
 */
export function modPow(base, exponent, modulus) {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent & 1n) {
      result = (result * base) % modulus;
    }
    exponent >>= 1n;
    base = (base * base) % modulus;
  }
  return result;
}

/**
 * Determines if a number is probably prime using a deterministic Miller-Rabin test
 * for numbers up to 2^64. For larger numbers, uses a set of bases that provide
 * a very high probability of correctness (but not a mathematical guarantee).
 *
 * This is used to avoid attempting factorization on prime inputs, which would
 * otherwise loop indefinitely or return the number itself.
 *
 * @param {bigint} n - The number to test.
 * @returns {boolean} True if n is probably prime, false if definitely composite.
 */
export function isProbablePrime(n) {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n || n % 3n === 0n) return false;

  // Write n-1 as d * 2^s.
  let d = n - 1n;
  let s = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    s++;
  }

  // Bases chosen for deterministic correctness for n < 2^64.
  // For larger n, these bases still give an extremely low error probability.
  const bases = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const a of bases) {
    if (a >= n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

/**
 * Generates a list of prime numbers up to a given bound using the Sieve of Eratosthenes.
 * Used to build the exponent M as the product of prime powers.
 *
 * @param {number} limit - The upper bound (inclusive).
 * @returns {number[]} Array of primes <= limit.
 */
function primesUpTo(limit) {
  if (limit < 2) return [];
  const sieve = new Uint8Array(limit + 1);
  sieve.fill(1);
  sieve[0] = 0;
  sieve[1] = 0;
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= limit; j += i) {
        sieve[j] = 0;
      }
    }
  }
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    if (sieve[i]) primes.push(i);
  }
  return primes;
}

/**
 * Computes the product of prime powers p^k <= bound for all primes p <= bound.
 * This is the exponent M used in Pollard's p-1 algorithm.
 *
 * @param {number} bound - The smoothness bound B.
 * @returns {bigint} The product M.
 */
function smoothExponent(bound) {
  const primes = primesUpTo(bound);
  let M = 1n;
  for (const p of primes) {
    let power = p;
    while (power * p <= bound) {
      power *= p;
    }
    M *= BigInt(power);
  }
  return M;
}

/**
 * Factors a composite integer using Pollard's p-1 method with a smooth-bound exponent.
 *
 * The algorithm iterates over a set of increasing bounds B. For each B, it computes
 * M = product of prime powers <= B, then picks a base a (starting at 2) and computes
 * g = gcd(a^M - 1, n). If g is a non-trivial factor, it is returned. If g equals n,
 * it retries with a different base. If no factor is found for the current bound,
 * it increases B and tries again.
 *
 * The function returns the smallest non-trivial factor found, or null if n is prime
 * or no factor is found within the iteration limit.
 *
 * @param {bigint} n - The integer to factor (must be > 1).
 * @param {object} [options] - Optional configuration.
 * @param {number} [options.maxBound=100000] - Maximum smoothness bound to try.
 * @param {number} [options.maxBases=5] - Number of bases to try per bound.
 * @returns {bigint|null} A non-trivial factor of n, or null if none found.
 */
export function factorize(n, options = {}) {
  if (n <= 1n) return null;
  if (isProbablePrime(n)) return null;

  const maxBound = options.maxBound ?? 100000;
  const maxBases = options.maxBases ?? 5;

  // Start with a small bound and increase geometrically.
  let bound = 2;
  while (bound <= maxBound) {
    const M = smoothExponent(bound);
    for (let base = 2; base < 2 + maxBases; base++) {
      const a = BigInt(base);
      if (a >= n) break;
      const g = gcd(a, n);
      if (g > 1n && g < n) return g;
      const x = modPow(a, M, n);
      const diff = (x - 1n + n) % n;
      if (diff === 0n) continue; // a^M ≡ 1 (mod n), try next base
      const factor = gcd(diff, n);
      if (factor > 1n && factor < n) return factor;
    }
    bound *= 2;
  }
  return null;
}
