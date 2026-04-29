/**
 * Lightweight email validator that avoids polynomial-time backtracking.
 *
 * - Hard length cap (RFC 5321 limits real addresses to 254 chars).
 * - Single `@` separator check, then bounded character-class checks per side.
 * - No nested unbounded quantifiers, so input cannot trigger ReDoS.
 */
export function isValidEmail(input: unknown): boolean {
  if (typeof input !== 'string') return false;
  const s = input.trim();
  if (s.length === 0 || s.length > 254) return false;

  const at = s.indexOf('@');
  if (at <= 0 || at !== s.lastIndexOf('@')) return false;

  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (local.length === 0 || local.length > 64) return false;
  if (domain.length === 0 || domain.length > 253) return false;

  const dot = domain.indexOf('.');
  if (dot <= 0 || dot === domain.length - 1) return false;

  // Allowed-character check; no quantifier nesting.
  const localOk = /^[A-Za-z0-9._%+\-]+$/.test(local);
  const domainOk = /^[A-Za-z0-9.\-]+$/.test(domain);
  return localOk && domainOk;
}
