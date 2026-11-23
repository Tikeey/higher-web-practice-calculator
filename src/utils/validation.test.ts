import { describe, expect, it } from 'vitest';

import { parseAmount } from './validation';

describe('parseAmount', () => {
	it('parses plain numbers', () => {
		expect(parseAmount('1500')).toBe(1500);
	});

	it('accepts a comma as the decimal separator', () => {
		expect(parseAmount('12,5')).toBe(12.5);
	});

	it('ignores spaces and currency symbols', () => {
		expect(parseAmount('1 500,50 ₽')).toBe(1500.5);
	});

	it('returns 0 for text without digits', () => {
		expect(parseAmount('abc')).toBe(0);
	});
});
