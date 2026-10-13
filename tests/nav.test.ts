import { expect, it } from 'vitest';
import { navItems } from '../src/lib/nav';
it('nav links are in-page anchors in section order', () => {
  expect(navItems.map((n) => n.href)).toEqual(['#about', '#experience', '#services', '#work', '#contact']);
});
