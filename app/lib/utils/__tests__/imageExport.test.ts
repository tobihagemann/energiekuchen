import { activityLayoutKey, buildExportFilename, formatExportDate, wrapLabelText } from '@/app/lib/utils/imageExport';
import type { Activity } from '@/app/types';

describe('buildExportFilename', () => {
  it('formats an injected date as energiekuchen_YYYY-MM-DD_HH-MM-SS.<ext>', () => {
    const date = new Date(2026, 5, 30, 14, 5, 9); // June 30, 2026, 14:05:09
    expect(buildExportFilename('png', date)).toBe('energiekuchen_2026-06-30_14-05-09.png');
  });

  it('zero-pads single-digit month, day, and time components', () => {
    const date = new Date(2026, 0, 1, 3, 4, 5); // January 1, 2026, 03:04:05
    expect(buildExportFilename('json', date)).toBe('energiekuchen_2026-01-01_03-04-05.json');
  });

  it('uses the provided extension', () => {
    const date = new Date(2026, 5, 30, 14, 5, 9);
    expect(buildExportFilename('json', date)).toMatch(/\.json$/);
    expect(buildExportFilename('png', date)).toMatch(/\.png$/);
  });

  it('defaults to the current date with a well-formed name', () => {
    expect(buildExportFilename('png')).toMatch(/^energiekuchen_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.png$/);
  });
});

describe('formatExportDate', () => {
  it('formats as zero-padded DD.MM.YYYY', () => {
    expect(formatExportDate(new Date(2026, 5, 7))).toBe('07.06.2026'); // June 7, 2026
  });

  it('defaults to the current date with a well-formed string', () => {
    expect(formatExportDate()).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });
});

describe('activityLayoutKey', () => {
  const base: Activity = { id: 'a', name: 'Yoga', weight: 5, polarity: 'positive' };

  it('is stable across equal layout fields', () => {
    expect(activityLayoutKey([base])).toBe(activityLayoutKey([{ ...base }]));
  });

  it('changes when any layout-affecting field changes', () => {
    expect(activityLayoutKey([base])).not.toBe(activityLayoutKey([{ ...base, weight: 6 }]));
    expect(activityLayoutKey([base])).not.toBe(activityLayoutKey([{ ...base, name: 'Pilates' }]));
    expect(activityLayoutKey([base])).not.toBe(activityLayoutKey([{ ...base, polarity: 'negative' }]));
  });

  it('includes optional details and labelOffset', () => {
    const key = activityLayoutKey([{ ...base, details: 'x', labelOffset: { radial: 1, angular: 0 } }]);
    expect(key).toContain('"details":"x"');
    expect(key).toContain('"labelOffset"');
  });
});

describe('wrapLabelText', () => {
  // maxChars = floor(maxWidthPx / (fontSize * 0.6)); with 36 / (10 * 0.6) = 6.
  it('keeps a short string on one line', () => {
    expect(wrapLabelText('hallo welt', 120, 10)).toEqual(['hallo welt']);
  });

  it('greedily wraps words across multiple lines', () => {
    expect(wrapLabelText('one two three four five', 36, 10)).toEqual(['one', 'two', 'three', 'four', 'five']);
  });

  it('breaks a single overlong token mid-word', () => {
    expect(wrapLabelText('abcdefghij', 36, 10)).toEqual(['abcdef', 'ghij']);
  });

  it('flushes the pending line before breaking an overlong token that follows it', () => {
    expect(wrapLabelText('hi abcdefghij', 36, 10)).toEqual(['hi', 'abcdef', 'ghij']);
  });

  it('falls back to a one-character budget for an oversized font', () => {
    expect(wrapLabelText('ab', 1, 100)).toEqual(['a', 'b']);
  });

  it('returns a single empty line for empty text', () => {
    expect(wrapLabelText('', 120, 10)).toEqual(['']);
  });

  it('does not split an emoji surrogate pair when breaking an overlong token', () => {
    // maxChars = floor(12 / (10 * 0.6)) = 2; each 😀 is one code point.
    expect(wrapLabelText('😀😀😀', 12, 10)).toEqual(['😀😀', '😀']);
  });
});
