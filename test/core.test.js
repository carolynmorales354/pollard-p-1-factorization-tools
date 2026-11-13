import { test } from 'node:test';
import assert from 'node:assert/strict';
import { factorize, modPow, gcd, isProbablePrime } from '../src/index.js';

test('gcd computes greatest common divisor', () => {
  assert.equal(gcd(12n, 18n), 6n);
  assert.equal(gcd(0n, 5n), 5n);
  assert.equal(gcd(0n, 0n), 0n);
  assert.equal(gcd(-12n, 18n), 6n);
  assert.equal(gcd(17n, 13n), 1n);
});

test('modPow computes modular exponentiation', () => {
  assert.equal(modPow(2n, 10n, 1000n), 24n);
  assert.equal(modPow(3n, 0n, 7n), 1n);
  assert.equal(modPow(0n, 5n, 7n), 0n);
  assert.equal(modPow(5n, 3n, 13n), 8n);
  assert.equal(modPow(2n, 100n, 1n), 0n);
});

test('isProbablePrime identifies primes and composites', () => {
  assert.equal(isProbablePrime(2n), true);
  assert.equal(isProbablePrime(3n), true);
  assert.equal(isProbablePrime(4n), false);
  assert.equal(isProbablePrime(17n), true);
  assert.equal(isProbablePrime(100n), false);
  assert.equal(isProbablePrime(561n), false); // Carmichael number
  assert.equal(isProbablePrime(7919n), true); // prime
  assert.equal(isProbablePrime(7917n), false); // 3 * 2639
});

test('factorize returns a non-trivial factor for composite numbers', () => {
  // Small composites
  assert.equal(factorize(15n), 3n);
  assert.equal(factorize(21n), 3n);
  assert.equal(factorize(25n), 5n);
  assert.equal(factorize(100n), 2n);
  assert.equal(factorize(49n), 7n);
});

test('factorize handles numbers with smooth p-1', () => {
  // p = 11, p-1 = 10 = 2 * 5, very smooth
  assert.equal(factorize(11n * 13n), 13n);
  // p = 17, p-1 = 16 = 2^4
  assert.equal(factorize(17n * 19n), 17n);
  // p = 23, p-1 = 22 = 2 * 11
  assert.equal(factorize(23n * 29n), 29n);
});

test('factorize returns null for primes', () => {
  assert.equal(factorize(2n), null);
  assert.equal(factorize(3n), null);
  assert.equal(factorize(17n), null);
  assert.equal(factorize(7919n), null);
});

test('factorize returns null for 0 and 1', () => {
  assert.equal(factorize(0n), null);
  assert.equal(factorize(1n), null);
});

test('factorize finds factor for larger numbers with smooth p-1', () => {
  // 1234567891 is prime? Let's use a known composite with smooth p-1.
  // p = 1009, p-1 = 1008 = 2^4 * 3^2 * 7
  const p = 1009n;
  const q = 1013n;
  const n = p * q;
  const factor = factorize(n);
  assert.ok(factor === p || factor === q, `expected ${p} or ${q}, got ${factor}`);
});

test('factorize respects maxBound option', () => {
  // A number with a factor whose p-1 is not smooth within a very small bound.
  // p = 101, p-1 = 100 = 2^2 * 5^2, smooth up to 5.
  // With maxBound=3, should fail to find factor.
  const n = 101n * 103n;
  assert.equal(factorize(n, { maxBound: 3 }), null);
  // With a larger bound, it should find it.
  assert.equal(factorize(n, { maxBound: 100 }), 101n);
});
