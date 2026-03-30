import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from './logger.js';

describe('createLogger', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function lastOutput(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1];
    const raw = lastCall[0] as string;
    return JSON.parse(raw.trim());
  }

  describe('output format', () => {
    it('produces valid JSON with level, message, timestamp, and context', () => {
      const logger = createLogger('test-service');
      logger.info('hello');

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const entry = lastOutput(stdoutSpy);
      expect(entry.level).toBe('info');
      expect(entry.message).toBe('hello');
      expect(entry.timestamp).toBeDefined();
      expect(typeof entry.timestamp).toBe('string');
      expect(entry.context).toEqual(expect.objectContaining({ service: 'test-service' }));
    });

    it('includes the service name in context', () => {
      const logger = createLogger('my-api');
      logger.warn('low disk');

      const entry = lastOutput(stdoutSpy);
      expect((entry.context as Record<string, unknown>).service).toBe('my-api');
    });

    it('merges additional context with service', () => {
      const logger = createLogger('worker');
      logger.info('processing', { jobId: 'abc-123', attempt: 2 });

      const entry = lastOutput(stdoutSpy);
      const ctx = entry.context as Record<string, unknown>;
      expect(ctx.service).toBe('worker');
      expect(ctx.jobId).toBe('abc-123');
      expect(ctx.attempt).toBe(2);
    });

    it('produces a valid ISO 8601 timestamp', () => {
      const logger = createLogger('svc');
      logger.info('test');

      const entry = lastOutput(stdoutSpy);
      const ts = entry.timestamp as string;
      expect(() => new Date(ts)).not.toThrow();
      expect(new Date(ts).toISOString()).toBe(ts);
    });
  });

  describe('log levels', () => {
    it('writes debug, info, and warn to stdout', () => {
      const logger = createLogger('svc', 'debug');
      logger.debug('d');
      logger.info('i');
      logger.warn('w');

      expect(stdoutSpy).toHaveBeenCalledTimes(3);
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it('writes error to stderr', () => {
      const logger = createLogger('svc');
      logger.error('boom');

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).not.toHaveBeenCalled();

      const entry = lastOutput(stderrSpy);
      expect(entry.level).toBe('error');
      expect(entry.message).toBe('boom');
    });

    it('sets the correct level field for each method', () => {
      const logger = createLogger('svc', 'debug');

      logger.debug('d');
      expect(lastOutput(stdoutSpy).level).toBe('debug');

      logger.info('i');
      expect(lastOutput(stdoutSpy).level).toBe('info');

      logger.warn('w');
      expect(lastOutput(stdoutSpy).level).toBe('warn');

      logger.error('e');
      expect(lastOutput(stderrSpy).level).toBe('error');
    });
  });

  describe('minLevel filtering', () => {
    it('defaults to info level, suppressing debug', () => {
      const logger = createLogger('svc');
      logger.debug('should be hidden');

      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it('allows debug when minLevel is debug', () => {
      const logger = createLogger('svc', 'debug');
      logger.debug('visible');

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
    });

    it('suppresses info and debug when minLevel is warn', () => {
      const logger = createLogger('svc', 'warn');
      logger.debug('hidden');
      logger.info('hidden');
      logger.warn('visible');
      logger.error('visible');

      expect(stdoutSpy).toHaveBeenCalledTimes(1); // warn
      expect(stderrSpy).toHaveBeenCalledTimes(1); // error
    });

    it('only allows error when minLevel is error', () => {
      const logger = createLogger('svc', 'error');
      logger.debug('hidden');
      logger.info('hidden');
      logger.warn('hidden');
      logger.error('visible');

      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('handles empty message', () => {
      const logger = createLogger('svc');
      logger.info('');

      const entry = lastOutput(stdoutSpy);
      expect(entry.message).toBe('');
    });

    it('handles undefined context gracefully', () => {
      const logger = createLogger('svc');
      logger.info('no context');

      const entry = lastOutput(stdoutSpy);
      expect(entry.context).toEqual({ service: 'svc' });
    });

    it('handles empty context object', () => {
      const logger = createLogger('svc');
      logger.info('empty ctx', {});

      const entry = lastOutput(stdoutSpy);
      expect(entry.context).toEqual({ service: 'svc' });
    });

    it('appends newline to each log output', () => {
      const logger = createLogger('svc');
      logger.info('test');

      const raw = stdoutSpy.mock.calls[0][0] as string;
      expect(raw.endsWith('\n')).toBe(true);
    });
  });
});
