import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { calculateMetrics } from './budget-calculator';

import type { Budget, Transaction } from '../models/schemas';

function makeBudget(overrides: Partial<Budget> = {}): Budget {
	return {
		id: 'current',
		initialBalance: 10000,
		startDate: '2026-06-10',
		endDate: '2026-06-24',
		createdAt: '2026-06-10T00:00:00.000Z',
		...overrides,
	};
}

function tx(id: string, type: Transaction['type'], amount: number, date: string): Transaction {
	return { id, type, amount, date };
}

describe('test environment', () => {
	it('runs in UTC+5 (set in vitest.config.ts)', () => {
		expect(new Date(2026, 5, 16, 12, 0).getTimezoneOffset()).toBe(-300);
	});
});

describe('F1: days are local calendar days, not UTC days', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	function setNow(date: Date): void {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(date);
	}

	it("does not count yesterday's afternoon expense as today's after local midnight", () => {
		// 02:30 local on 16 June is still 15 June in UTC.
		setNow(new Date(2026, 5, 16, 2, 30));
		const spentYesterday = new Date(2026, 5, 15, 12, 0).toISOString();

		const m = calculateMetrics(makeBudget(), [tx('1', 'expense', 1000, spentYesterday)]);

		expect(m.todaySpent).toBe(0);
		expect(m.dailyBudget).toBe(1000);
		expect(m.todayRemaining).toBe(1000);
	});

	it('counts an expense made at 01:00 local time as spent today', () => {
		setNow(new Date(2026, 5, 16, 12, 0));
		// 01:00 local on 16 June is 20:00 UTC on 15 June.
		const spentAfterMidnight = new Date(2026, 5, 16, 1, 0).toISOString();

		const m = calculateMetrics(makeBudget(), [tx('1', 'expense', 500, spentAfterMidnight)]);

		expect(m.todaySpent).toBe(500);
		expect(m.todayRemaining).toBe(m.dailyBudget - 500);
	});

	it('does not throw on a malformed transaction date', () => {
		setNow(new Date(2026, 5, 16, 12, 0));

		const m = calculateMetrics(makeBudget(), [tx('1', 'expense', 100, 'not-a-date')]);

		expect(m.totalSpent).toBe(100);
		expect(m.todaySpent).toBe(0);
	});
});

describe('F2: money arithmetic is exact to the cent', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date(2026, 5, 16, 12, 0));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('0.3 minus 0.1 leaves exactly 0.2', () => {
		const m = calculateMetrics(makeBudget({ initialBalance: 0.3, endDate: '2026-12-31' }), [
			tx('1', 'expense', 0.1, new Date().toISOString()),
		]);

		expect(m.totalBalance).toBe(0.2);
	});

	it('0.1 plus 0.2 of expenses totals exactly 0.3', () => {
		const m = calculateMetrics(makeBudget({ initialBalance: 5, endDate: '2026-12-31' }), [
			tx('1', 'expense', 0.1, new Date().toISOString()),
			tx('2', 'expense', 0.2, new Date().toISOString()),
		]);

		expect(m.totalSpent).toBe(0.3);
		expect(m.totalBalance).toBe(4.7);
	});
});
