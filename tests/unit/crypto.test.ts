import { describe, it, expect } from 'vitest';
import { generateAccessToken, hashToken } from '../../src/lib/crypto';

describe('Crypto & Token Utilities', () => {
  it('generates high-entropy 64-character hex access token', () => {
    const token1 = generateAccessToken(32);
    const token2 = generateAccessToken(32);

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
    expect(/^[0-9a-f]{64}$/.test(token1)).toBe(true);
  });

  it('generates deterministic SHA-256 hash', async () => {
    const token = '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';
    const hash1 = await hashToken(token);
    const hash2 = await hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(token);
  });
});
