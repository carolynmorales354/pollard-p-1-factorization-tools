# pollard-p-1-factorization-tools

A zero-dependency TypeScript/JavaScript library for factoring large integers using Pollard's p-1 algorithm with smooth-bound exponent accumulation.

## Usage

```js
import { factorize, gcd, modPow, isProbablePrime } from 'pollard-p-1-factorization-tools';

// Factor a composite number
const factor = factorize(1234567891n * 9876543211n);
console.log(factor); // a non-trivial factor, or null if none found

// Utility functions
gcd(12n, 18n); // 6n
modPow(2n, 10n, 1000n); // 24n
isProbablePrime(17n); // true
```

## Why this library exists

Pollard's p-1 method is a classic integer factorization algorithm that works well when a composite number has a prime factor `p` such that `p-1` is smooth (all prime factors are small). The algorithm computes `a^M mod n` where `M` is the product of prime powers up to a smoothness bound `B`, then takes `gcd(a^M - 1, n)`. If `p-1` is `B`-smooth, this gcd reveals a factor.

The trade-off is that the algorithm's success depends on the smoothness of `p-1`. For arbitrary large integers, other methods (like ECM or the quadratic sieve) are more reliable. This library is intended for educational and lightweight factoring tasks where the numbers are known to have smooth `p-1` factors, or as a building block in a larger factorization pipeline.

## Awkward edge

If `n` is prime, or if no factor with a smooth enough `p-1` exists within the configured bounds, `factorize` returns `null`. It does not throw. This means callers must check for `null` before using the result. The function also does not attempt to factor `n` completely; it returns the first non-trivial factor found, which may be composite itself.

## API

- `factorize(n, options?)`: Returns a `bigint` factor of `n`, or `null` if none found. Options: `maxBound` (default 100000), `maxBases` (default 5).
- `gcd(a, b)`: Returns the greatest common divisor as a `bigint`.
- `modPow(base, exponent, modulus)`: Returns `(base ** exponent) % modulus` as a `bigint`.
- `isProbablePrime(n)`: Returns `true` if `n` is probably prime, `false` if definitely composite.
