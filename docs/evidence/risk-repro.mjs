// Read-only reproduction of risk findings F1-F3 (Assignment #05, Task 4). Does NOT modify the repository.
// Usage from the repo root:
//   npx esbuild src/services/budget-calculator.ts --bundle --platform=node --format=esm --outfile=<TMP>/bc.mjs
//   node docs/evidence/risk-repro.mjs <TMP>/bc.mjs
import { pathToFileURL } from 'node:url';

const RealDate = Date;
let fixed = null;
class FakeDate extends RealDate {
	constructor(...a) {
		if (a.length === 0 && fixed !== null) super(fixed);
		else super(...a);
	}
	static now() {
		return fixed ?? RealDate.now();
	}
}
globalThis.Date = FakeDate;

const bundle = process.argv[2];
if (!bundle) throw new Error('Pass the path to the bundled bc.mjs as the first argument');
const { calculateMetrics } = await import(pathToFileURL(bundle).href);

const offsetMin = -new RealDate(2026, 5, 16, 12, 0).getTimezoneOffset();
console.log(`Machine time zone offset: UTC${offsetMin >= 0 ? '+' : '-'}${Math.abs(offsetMin / 60)}h`);

// F1: UTC "today" vs local day
const budget = { id: 'current', initialBalance: 10000, startDate: '2026-06-10', endDate: '2026-06-24', createdAt: 'x' };
const expense = new RealDate(2026, 5, 15, 12, 0).toISOString();
const tx = [{ id: 't1', type: 'expense', amount: 1000, date: expense }];
for (const [label, h, m] of [['02:30 local on 16 June', 2, 30], ['12:00 local on 16 June', 12, 0]]) {
	fixed = new RealDate(2026, 5, 16, h, m).getTime();
	const r = calculateMetrics(budget, tx);
	console.log(`F1 ${label} -> todaySpent=${r.todaySpent}, dailyBudget=${r.dailyBudget}, todayRemaining=${r.todayRemaining}`);
}
if (offsetMin < 180) console.log('   (note: with an offset below +3h the two cases give the same result; F1 needs a zone like UTC+5)');

// F2: floating-point money
fixed = new RealDate(2099, 0, 1, 12, 0).getTime();
const b2 = { id: 'current', initialBalance: 0.3, startDate: '2099-01-01', endDate: '2099-12-31', createdAt: 'x' };
const t2 = [{ id: 'a', type: 'expense', amount: 0.1, date: '2099-01-01T12:00:00.000Z' }];
const left = calculateMetrics(b2, t2).totalBalance;
console.log(`F2 balance 0.3 after spending 0.1 = ${left}; spending the remaining 0.2 is rejected by "amount > totalBalance": ${0.2 > left}`);

// F3: negative balance hidden after deleting an income
fixed = new RealDate(2026, 5, 15, 12, 0).getTime();
const b3 = { id: 'current', initialBalance: 1000, startDate: '2026-06-15', endDate: '2026-06-24', createdAt: 'x' };
const income = { id: 'i', type: 'income', amount: 500, date: '2026-06-14T07:00:00.000Z' };
const spend = { id: 'e', type: 'expense', amount: 1200, date: '2026-06-14T09:00:00.000Z' };
console.log(`F3 balance with income+expense = ${calculateMetrics(b3, [income, spend]).totalBalance}`);
console.log(`F3 balance after deleting the income = ${calculateMetrics(b3, [spend]).totalBalance} (arithmetic value would be ${1000 - 1200})`);
