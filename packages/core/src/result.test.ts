import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, type Result } from './result.js';

describe('result', () => {
  describe('ok()', () => {
    it('creates a Result with ok: true and the given value', () => {
      const result = ok(42);
      expect(result).toEqual({ ok: true, value: 42 });
    });

    it('wraps a string value', () => {
      const result = ok('hello');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('hello');
      }
    });

    it('wraps an object value', () => {
      const data = { id: 1, name: 'test' };
      const result = ok(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(data);
      }
    });

    it('wraps null and undefined values', () => {
      expect(ok(null)).toEqual({ ok: true, value: null });
      expect(ok(undefined)).toEqual({ ok: true, value: undefined });
    });

    it('wraps an empty array', () => {
      const result = ok([]);
      expect(result).toEqual({ ok: true, value: [] });
    });
  });

  describe('err()', () => {
    it('creates a Result with ok: false and the given error', () => {
      const error = new Error('something failed');
      const result = err(error);
      expect(result).toEqual({ ok: false, error });
    });

    it('wraps a string error', () => {
      const result = err('not found');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('not found');
      }
    });

    it('wraps a structured error object', () => {
      const apiErr = { code: 'NOT_FOUND', message: 'Resource missing' };
      const result = err(apiErr);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(apiErr);
      }
    });
  });

  describe('isOk()', () => {
    it('returns true for ok results', () => {
      const result = ok('value');
      expect(isOk(result)).toBe(true);
    });

    it('returns false for err results', () => {
      const result = err(new Error('fail'));
      expect(isOk(result)).toBe(false);
    });

    it('narrows the type so .value is accessible', () => {
      const result: Result<number, string> = ok(99);
      if (isOk(result)) {
        // TypeScript should allow this without error
        const val: number = result.value;
        expect(val).toBe(99);
      }
    });
  });

  describe('isErr()', () => {
    it('returns true for err results', () => {
      const result = err('oops');
      expect(isErr(result)).toBe(true);
    });

    it('returns false for ok results', () => {
      const result = ok(1);
      expect(isErr(result)).toBe(false);
    });

    it('narrows the type so .error is accessible', () => {
      const result: Result<number, string> = err('bad');
      if (isErr(result)) {
        const e: string = result.error;
        expect(e).toBe('bad');
      }
    });
  });

  describe('isOk and isErr are mutually exclusive', () => {
    it('ok result: isOk is true and isErr is false', () => {
      const result = ok('x');
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
    });

    it('err result: isErr is true and isOk is false', () => {
      const result = err('y');
      expect(isErr(result)).toBe(true);
      expect(isOk(result)).toBe(false);
    });
  });
});
