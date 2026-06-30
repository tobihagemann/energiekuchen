import type { Activity } from '@/app/types';

// Pure, unit-tested helpers for image export. The DOM/canvas-bound counterparts (rasterize,
// download, share) live in imageExportBrowser.ts, which is E2E-tested and excluded from the
// utils coverage gate.

const pad2 = (value: number) => String(value).padStart(2, '0');

// Approximate average glyph advance as a fraction of the font size for a bold sans-serif.
// Used only to estimate where a name/details line wraps; the rendered <text> is then measured
// via getBBox (two-pass), so the estimate just needs to be close, not exact.
const CHAR_WIDTH_RATIO = 0.6;

// Greedy word wrap for native SVG <text>, which does not auto-wrap. Mirrors the live label's
// `overflow-wrap: break-word`: whole words flow onto a line until the width budget is reached,
// and a single overlong token (longer than the budget) is broken mid-word. Code points (not
// UTF-16 units) are used so emoji surrogate pairs are never split. Returns at least one line.
export function wrapLabelText(text: string, maxWidthPx: number, fontSize: number): string[] {
  const maxChars = Math.max(1, Math.floor(maxWidthPx / (fontSize * CHAR_WIDTH_RATIO)));
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const wordLength = [...word].length;
    if (wordLength > maxChars) {
      if (current) {
        lines.push(current);
        current = '';
      }
      const chars = [...word];
      for (let i = 0; i < chars.length; i += maxChars) {
        const chunk = chars.slice(i, i + maxChars).join('');
        if (i + maxChars < chars.length) lines.push(chunk);
        else current = chunk;
      }
    } else if (!current) {
      current = word;
    } else if ([...current].length + 1 + wordLength <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

// Filesystem-safe timestamped filename: energiekuchen_YYYY-MM-DD_HH-MM-SS.<ext>. The date is
// injectable so the format can be unit-tested deterministically.
export function buildExportFilename(ext: string, date: Date = new Date()): string {
  const timestamp = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}_${pad2(date.getHours())}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}`;
  return `energiekuchen_${timestamp}.${ext}`;
}

// Human-readable export date for the image footer: DD.MM.YYYY. Injectable for deterministic tests.
export function formatExportDate(date: Date = new Date()): string {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

// Stable identity of the activity fields that drive export chart layout. Shared by both export
// renderers so their re-measure / readiness keys can never silently diverge when a new
// layout-affecting field is added.
export function activityLayoutKey(activities: Activity[]): string {
  return JSON.stringify(
    activities.map(a => ({ id: a.id, name: a.name, weight: a.weight, polarity: a.polarity, details: a.details, labelOffset: a.labelOffset }))
  );
}
