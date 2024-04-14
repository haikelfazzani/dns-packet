import { encode, decode } from '../dist/index.mjs';
import axios from 'axios';
import { describe, it, } from 'node:test'
import { strictEqual, deepStrictEqual } from 'node:assert'

describe('should encode a DNS query packet with a single question correctly', () => {
  const packet = {
    id: 153,
    questions: [
      { CLASS: 'IN', NAME: 'google.com', TYPE: 'AAAA' }
    ]
  };

  const expected = new Uint8Array([
    0, 153, 8, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 6, 103, 111, 111,
    103, 108, 101, 3, 99, 111, 109, 0,
    0, 28, 0, 1
  ]);

  deepStrictEqual(encode(packet), expected, 'Arrays should be equal');
});

describe('should decode a DNS query packet with a single question correctly', () => {
  const packet = {
    id: 153,
    questions: [
      { CLASS: 'IN', NAME: 'google.com', TYPE: 'AAAA' }
    ]
  };

  const expected = new Uint8Array([
    0, 153, 8, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 6, 103, 111, 111,
    103, 108, 101, 3, 99, 111, 109, 0,
    0, 28, 0, 1
  ]);

  deepStrictEqual(encode(packet), expected, 'Arrays should be equal');
});