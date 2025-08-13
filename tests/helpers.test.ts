import { describe, expect, it } from 'vitest';
import { truthyFlag, deriveRegions, type DirectoryRecord } from '@/App';

describe('truthyFlag', () => {
  it('returns true for yes-like values', () => {
    expect(truthyFlag('yes')).toBe(true);
    expect(truthyFlag('Y')).toBe(true);
    expect(truthyFlag('1')).toBe(true);
    expect(truthyFlag('✓')).toBe(true);
  });

  it('returns false for falsy values', () => {
    expect(truthyFlag('no')).toBe(false);
    expect(truthyFlag(undefined)).toBe(false);
    expect(truthyFlag('')).toBe(false);
  });
});

describe('deriveRegions', () => {
  it('returns regions with truthy flags', () => {
    const record: DirectoryRecord = { South: 'yes', Midwest: 'true', Pacific: 'no' };
    expect(deriveRegions(record)).toEqual(['South', 'Midwest']);
  });
});
