import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { calculateMetrics } from './budget-calculator';

import type { Budget, Transaction } from '../models/schemas';

// Fixed "now": 15 June 2026, 12:00 local time. At local noon the UTC date and the
// local date are the same day in any normal time zone, so the tests are stable
// regardless of the machine's TZ.
const NOW = new Date(2026, 5, 15, 12, 0, 0);

function makeBudget(overrides: Partial<Budget> = {}): Budget {
	return {
		id: 'current',
		initialBalance: 10000,
		startDate: '2026-06-15',
		endDate: '2026-06-24', // 10 calendar days including today
		createdAt: '2026-06-15T07:00:00.000Z',
		...overrides,
	};
}

function tx(id: string, type: Transaction['type'], amount: number, date: string): Transaction {
	return { id, type, amount, date };
}

describe('calculateMetrics', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('without transactions splits the balance evenly over the remaining days (criterion 2)', () => {
		const m = calculateMetrics(makeBudget(), []);

		expect(m.totalBalance).toBe(10000);
		expect(m.daysRemaining).toBe(10);
		expect(m.dailyBudget).toBe(1000);
		expect(m.todaySpent).toBe(0);
		expect(m.todayRemaining).toBe(1000);
		expect(m.totalSpent).toBe(0);
		expect(m.averageDailySpending).toBe(0);
	});

	it('an expense today raises totalSpent and lowers todayRemaining by its amount (criterion 3)', () => {
		const before = calculateMetrics(makeBudget(), []);
		const after = calculateMetrics(makeBudget(), [tx('1', 'expense', 300, '2026-06-15')]);

		expect(after.totalSpent - before.totalSpent).toBe(300);
		expect(before.todayRemaining - after.todayRemaining).toBe(300);
		expect(after.todaySpent).toBe(300);
		expect(after.totalBalance).toBe(9700);
		expect(after.dailyBudget).toBe(1000);
	});

	it("an expense on another day lowers tomorrow's daily budget, not today's spent", () => {
		const m = calculateMetrics(makeBudget(), [tx('1', 'expense', 500, '2026-06-14')]);

		expect(m.todaySpent).toBe(0);
		expect(m.totalSpent).toBe(500);
		expect(m.totalBalance).toBe(9500);
		expect(m.dailyBudget).toBe(950);
		expect(m.todayRemaining).toBe(950);
	});

	it("income today is added to today's remaining amount without changing the daily budget", () => {
		const m = calculateMetrics(makeBudget(), [tx('1', 'income', 200, '2026-06-15')]);

		expect(m.totalBalance).toBe(10200);
		expect(m.dailyBudget).toBe(1000);
		expect(m.todayRemaining).toBe(1200);
	});

	it('averages spending per day that has at least one expense', () => {
		const m = calculateMetrics(makeBudget(), [
			tx('1', 'expense', 100, '2026-06-13'),
			tx('2', 'expense', 150, '2026-06-14'),
			tx('3', 'expense', 50, '2026-06-14'),
		]);

		expect(m.totalSpent).toBe(300);
		expect(m.averageDailySpending).toBe(150);
	});

	it('on the last day the whole balance is available', () => {
		const m = calculateMetrics(makeBudget({ endDate: '2026-06-15' }), []);

		expect(m.daysRemaining).toBe(1);
		expect(m.dailyBudget).toBe(10000);
	});

	it('after the end date there are no days left and nothing is available', () => {
		const m = calculateMetrics(makeBudget({ endDate: '2026-06-10' }), []);

		expect(m.daysRemaining).toBe(0);
		expect(m.dailyBudget).toBe(0);
		expect(m.todayRemaining).toBe(0);
	});

	it('rounds the daily budget down (current behaviour)', () => {
		const m = calculateMetrics(makeBudget({ initialBalance: 2000, endDate: '2026-06-17' }), []);

		expect(m.daysRemaining).toBe(3);
		expect(m.dailyBudget).toBe(666); // 2000 / 3 = 666.67, rounded down
	});

	it('clamps a negative balance to 0 (current behaviour, see risk review)', () => {
		const m = calculateMetrics(makeBudget(), [tx('1', 'expense', 12000, '2026-06-14')]);

		expect(m.totalSpent).toBe(12000);
		expect(m.totalBalance).toBe(0);
	});
});
