import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addTransaction, resetBudget, setBudget } from './state';

import type { Budget, Transaction } from '../models/schemas';

vi.mock('./db', () => ({
	addTransaction: vi.fn().mockResolvedValue(undefined),
	clearAllTransactions: vi.fn().mockResolvedValue(undefined),
	clearBudget: vi.fn().mockResolvedValue(undefined),
	deleteTransaction: vi.fn().mockResolvedValue(undefined),
	getAllTransactions: vi.fn().mockResolvedValue([]),
	getBudget: vi.fn().mockResolvedValue(undefined),
	saveBudget: vi.fn().mockResolvedValue(undefined),
}));

function makeBudget(initialBalance: number): Budget {
	return {
		id: 'current',
		initialBalance,
		startDate: '2026-06-10',
		endDate: '2026-12-31',
		createdAt: '2026-06-10T00:00:00.000Z',
	};
}

function expense(id: string, amount: number): Transaction {
	return { id, type: 'expense', amount, date: new Date().toISOString() };
}

describe('addTransaction balance check (F2)', () => {
	beforeEach(async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date(2026, 5, 16, 12, 0));
		await resetBudget();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('accepts spending exactly the remaining decimal balance', async () => {
		await setBudget(makeBudget(0.3));
		await addTransaction(expense('a', 0.1));

		await expect(addTransaction(expense('b', 0.2))).resolves.toBeUndefined();
	});

	it('accepts spending exactly what is left for every cent amount in a range', async () => {
		const rejected: number[] = [];

		for (let cents = 101; cents <= 400; cents++) {
			await resetBudget();
			await setBudget(makeBudget(cents / 100));
			const firstCents = Math.floor(cents / 3);
			await addTransaction(expense('a', firstCents / 100));
			try {
				await addTransaction(expense('b', (cents - firstCents) / 100));
			} catch {
				rejected.push(cents);
			}
		}

		expect(rejected).toEqual([]);
	});

	it('still rejects spending one cent more than the balance', async () => {
		await setBudget(makeBudget(0.3));

		await expect(addTransaction(expense('a', 0.31))).rejects.toThrow(
			'Сумма превышает остаток баланса',
		);
	});
});
