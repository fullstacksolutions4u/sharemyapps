// server/utils/sanitize.js
// XSS Prevention — Input Sanitization Helpers
// Docs: docs/security/01_xss_prevention.md

const sanitizeHtml = require('sanitize-html');

/**
 * Strip ALL HTML tags — use for plain-text fields
 * (names, titles, phone numbers, locations, etc.)
 */
const sanitizeText = (input) => {
  if (input === undefined || input === null) return input;
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

/**
 * Allow a safe subset of formatting HTML — use for rich text fields
 * (descriptions, bios, requirements, etc.)
 */
const sanitizeRichText = (input) => {
  if (input === undefined || input === null) return input;
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          href: sanitizeUrl(attribs.href) || '#',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
  });
};

/**
 * Validate and sanitize a URL — blocks javascript: and data: protocol injection.
 * Use for any user-supplied URL fields (liveUrl, linkedinUrl, githubUrl, etc.)
 */
const sanitizeUrl = (input) => {
  if (input === undefined || input === null) return input;
  if (typeof input !== 'string') return input;
  const trimmed = input.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    // Only allow safe HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return ''; // Malformed URL
  }
};

/**
 * Sanitize an array of strings (plain text)
 */
const sanitizeTextArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(sanitizeText).filter(Boolean);
};

/**
 * Sanitize an array of URLs
 */
const sanitizeUrlArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(sanitizeUrl).filter(Boolean);
};

module.exports = {
  sanitizeText,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeTextArray,
  sanitizeUrlArray,
};
