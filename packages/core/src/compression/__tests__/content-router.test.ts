import { describe, it, expect } from 'vitest';
import { detectContentType, ContentRouter } from '../content-router.js';

describe('detectContentType', () => {
  it('detects JSON content', () => {
    expect(detectContentType('{"key": "value", "arr": [1,2,3]}')).toBe('json');
    expect(detectContentType('[{"id": 1}, {"id": 2}]')).toBe('json');
  });

  it('detects code content', () => {
    expect(detectContentType('export function hello() {\n  return "hi";\n}')).toBe('code');
    expect(detectContentType('import { foo } from "./bar";\nclass MyClass {}')).toBe('code');
    expect(detectContentType('def calculate(x, y):\n    return x + y')).toBe('code');
  });

  it('detects prose content', () => {
    expect(detectContentType('This is a paragraph about authentication design decisions.')).toBe('prose');
    expect(detectContentType('The system should handle concurrent requests gracefully.')).toBe('prose');
  });

  it('returns unknown for empty content', () => {
    expect(detectContentType('')).toBe('unknown');
  });
});

describe('ContentRouter', () => {
  it('compresses JSON by extracting key schema', () => {
    const router = new ContentRouter();
    const result = router.compress('{"name": "Alice", "age": 30, "email": "a@b.com"}');
    expect(result.content_type).toBe('json');
    expect(result.summary.length).toBeLessThan(50);
  });

  it('compresses code by extracting signatures', () => {
    const router = new ContentRouter();
    const code = `export function authenticate(token: string): boolean {
  const decoded = jwt.verify(token);
  if (!decoded) return false;
  const user = db.findUser(decoded.id);
  return !!user;
}

export function logout(sessionId: string): void {
  sessions.delete(sessionId);
}`;
    const result = router.compress(code);
    expect(result.content_type).toBe('code');
    expect(result.summary).toContain('authenticate');
    expect(result.summary).toContain('logout');
  });

  it('compresses prose by extracting first sentences', () => {
    const router = new ContentRouter();
    const prose = 'Authentication uses JWT tokens. Refresh tokens last 7 days. Access tokens expire in 15 minutes. The system supports SSO via SAML. Rate limiting applies to login attempts.';
    const result = router.compress(prose);
    expect(result.content_type).toBe('prose');
    expect(result.summary.length).toBeLessThan(prose.length);
  });
});
