import { describe, expect, it } from 'vitest';

import { formatDate } from './format';

describe('formatDate', () => {
	it('shows the local calendar day of a full timestamp', () => {
		// 20:00 UTC on 15 June is already 16 June in UTC+5.
		expect(formatDate('2026-06-15T20:00:00.000Z')).toBe('16 июня');
	});

	it('shows a date-only value as it is', () => {
		expect(formatDate('2026-06-16')).toBe('16 июня');
	});
});
