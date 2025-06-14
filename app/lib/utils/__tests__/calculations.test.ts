import { generateUniqueId } from '@/app/lib/utils/calculations';

describe('calculations utilities', () => {
  describe('generateUniqueId', () => {
    it('generates unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('generates IDs with expected format', () => {
      const id = generateUniqueId();

      expect(id).toMatch(/^[0-9a-z]+$/);
      expect(id.length).toBeGreaterThan(10);
    });

    it('generates many unique IDs', () => {
      const ids = new Set();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(generateUniqueId());
      }

      expect(ids.size).toBe(count);
    });

    it('generates IDs that are URL-safe', () => {
      const id = generateUniqueId();

      // Should not contain characters that need URL encoding
      expect(id).not.toMatch(/[+/=]/);
    });
  });
});
