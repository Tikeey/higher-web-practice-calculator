import { defineConfig } from 'vitest/config';

// Tests run in UTC+5 (Asia/Almaty) so that time-zone dependent behaviour (risk F1)
// is reproducible on any machine, including CI runners that use UTC.
process.env.TZ = 'Asia/Almaty';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
	},
});
