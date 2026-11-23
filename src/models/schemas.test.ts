import { describe, expect, it } from 'vitest';

import { validate } from '../utils/validation';

import { BudgetInputSchema, TransactionInputSchema } from './schemas';

describe('BudgetInputSchema', () => {
	const valid = { initialBalance: 5000, startDate: '2026-06-15', endDate: '2026-06-30' };

	it('accepts a valid budget', () => {
		expect(validate(BudgetInputSchema, valid).success).toBe(true);
	});

	it('rejects a zero or negative balance (criterion 4)', () => {
		expect(validate(BudgetInputSchema, { ...valid, initialBalance: 0 }).success).toBe(false);
		expect(validate(BudgetInputSchema, { ...valid, initialBalance: -10 }).success).toBe(false);
	});

	it('rejects an end date earlier than the start date (criterion 4)', () => {
		const result = validate(BudgetInputSchema, { ...valid, endDate: '2026-06-01' });

		expect(result.success).toBe(false);
		expect(result.errors?.endDate).toBeDefined();
	});

	it('accepts an end date equal to the start date (current behaviour)', () => {
		const result = validate(BudgetInputSchema, { ...valid, endDate: '2026-06-15' });

		expect(result.success).toBe(true);
	});
});

describe('TransactionInputSchema', () => {
	it('accepts a positive expense and income', () => {
		expect(validate(TransactionInputSchema, { amount: 100, type: 'expense' }).success).toBe(true);
		expect(validate(TransactionInputSchema, { amount: 100, type: 'income' }).success).toBe(true);
	});

	it('rejects a zero or negative amount (criterion 4)', () => {
		expect(validate(TransactionInputSchema, { amount: 0, type: 'expense' }).success).toBe(false);
		expect(validate(TransactionInputSchema, { amount: -5, type: 'expense' }).success).toBe(false);
	});

	it('rejects an unknown transaction type', () => {
		expect(validate(TransactionInputSchema, { amount: 100, type: 'gift' }).success).toBe(false);
	});
});
