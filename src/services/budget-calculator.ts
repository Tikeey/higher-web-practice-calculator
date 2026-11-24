import { differenceInCalendarDays, format, isValid, parseISO, startOfDay } from 'date-fns';

import type { Budget, Transaction } from '../models/schemas';

export interface BudgetMetrics {
	totalBalance: number;
	daysRemaining: number;
	dailyBudget: number;
	todaySpent: number;
	todayRemaining: number;
	averageDailySpending: number;
	totalSpent: number;
}

const DAY_KEY_FORMAT = 'yyyy-MM-dd';

// Money is summed in integer cents: binary floats cannot represent amounts such as 0.1 exactly,
// so 0.3 - 0.1 would give 0.19999999999999998 and break comparisons against the balance.
function toCents(amount: number): number {
	return Math.round(amount * 100);
}

function fromCents(cents: number): number {
	return cents / 100;
}

// Calendar day in the user's local time zone, e.g. '2026-06-16'.
function localDayKey(date: Date): string {
	return format(date, DAY_KEY_FORMAT);
}

// Transactions are stored as UTC timestamps, so the stored text cannot be cut to a date directly:
// it has to be converted to the local calendar day first.
function transactionDayKey(t: Transaction): string {
	const parsed = parseISO(t.date);
	return isValid(parsed) ? localDayKey(parsed) : t.date.slice(0, 10);
}

function sumCents(
	transactions: Transaction[],
	type: Transaction['type'],
	dateISO?: string,
): number {
	return transactions
		.filter(t => t.type === type && (dateISO === undefined || transactionDayKey(t) === dateISO))
		.reduce((acc, t) => acc + toCents(t.amount), 0);
}

function countSpendingDays(transactions: Transaction[]): number {
	const dates = new Set<string>();
	for (const t of transactions) {
		if (t.type === 'expense') {
			dates.add(transactionDayKey(t));
		}
	}
	return dates.size;
}

export function calculateMetrics(budget: Budget, transactions: Transaction[]): BudgetMetrics {
	const now = new Date();
	const today = startOfDay(now);
	const end = startOfDay(parseISO(budget.endDate));

	const daysRemainingRaw = differenceInCalendarDays(end, today) + 1;
	const daysRemaining = Math.max(daysRemainingRaw, 0);

	const initialCents = toCents(budget.initialBalance);
	const spentCents = sumCents(transactions, 'expense');
	const incomeCents = sumCents(transactions, 'income');
	const balanceCents = Math.max(initialCents + incomeCents - spentCents, 0);

	const todayKey = localDayKey(now);
	const todaySpentCents = sumCents(transactions, 'expense', todayKey);
	const todayIncomeCents = sumCents(transactions, 'income', todayKey);

	const balanceExTodayIncomeCents = Math.max(
		initialCents + (incomeCents - todayIncomeCents) - spentCents,
		0,
	);
	const dailyBudget =
		daysRemaining > 0
			? Math.floor((balanceExTodayIncomeCents + todaySpentCents) / (daysRemaining * 100))
			: 0;

	const todayRemainingCents = Math.max(dailyBudget * 100 - todaySpentCents + todayIncomeCents, 0);

	const spendingDays = countSpendingDays(transactions);
	const averageDailySpending = spendingDays > 0 ? Math.round(spentCents / (spendingDays * 100)) : 0;

	return {
		totalBalance: fromCents(balanceCents),
		daysRemaining,
		dailyBudget,
		todaySpent: fromCents(todaySpentCents),
		todayRemaining: fromCents(todayRemainingCents),
		averageDailySpending,
		totalSpent: fromCents(spentCents),
	};
}
