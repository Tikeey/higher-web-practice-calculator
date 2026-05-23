# Проект «Калькулятор расходов»

## Описание

**Калькулятор расходов** — TypeScript SPA для управления ежедневным бюджетом. Пользователь задаёт стартовый баланс и срок, а приложение рассчитывает дневной лимит, отслеживает траты и хранит историю транзакций в IndexedDB.

## Разработчик

- **ФИО**: Старостин Леонид Федорович
- **Курс**: 1 курс, магистратура, ИТМО
- **Направление**: Фронтенд и Бэкенд разработка, JavaScript, базовый трек

## Ссылки

- [Макет](https://www.figma.com/design/8UievNaMQUQrzAHNqqymwQ/%D0%9F%D1%80%D0%BE%D0%B5%D0%BA%D1%82%E2%80%A8%C2%AB%D0%9A%D0%B0%D0%BB%D1%8C%D0%BA%D1%83%D0%BB%D1%8F%D1%82%D0%BE%D1%80%E2%80%A8%D1%80%D0%B0%D1%81%D1%85%D0%BE%D0%B4%D0%BE%D0%B2%C2%BB?node-id=12-4354&p=f&t=pH1Ofz3zR5NDR8gS-0)
- [GitHub-репозиторий](https://github.com/StarostinLF/higher-web-practice-calculator)

## Стек

- `HTML`, `CSS`, `TypeScript`
- `Vite`
- `Tailwind CSS`
- `IndexedDB`
- `Zod`
- `date-fns`

## Установка

```bash
npm install
```

## Запуск в режиме разработки

```bash
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Сборка для продакшена

```bash
npm run build
npm run preview
```

## Проверки

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint
npm run validate     # type-check + lint + prettier
```

## Структура

``` src/
├── App.ts                       # роутер
├── main.ts                      # точка входа
├── styles.css                   # Tailwind + дизайн-токены
├── models/schemas.ts            # Zod-схемы и типы
├── services/budget-calculator.ts # расчёт метрик
├── components/                  # переиспользуемые UI
│   ├── input.ts
│   ├── date-input.ts            # календарь
│   └── period-select.ts         # дропдаун со сроком
├── pages/                       # страницы
│   ├── start-page.ts
│   ├── main-page.ts
│   └── history-page.ts
└── utils/
    ├── db.ts                    # IndexedDB
    ├── state.ts                 # state manager
    ├── format.ts                # форматирование денег и дат
    └── validation.ts            # обёртка над Zod
```
