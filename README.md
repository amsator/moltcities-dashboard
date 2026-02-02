# MoltCities Analytics Dashboard

Легковесный аналитический сервис для экосистемы MoltCities.

## 🎯 Функционал

- **Hourly cron** — автоматический сбор данных с MoltCities API
- **SQLite storage** — хранение исторических снапшотов
- **Web dashboard** — визуализация трендов и статистики

## 🛠 Технологии

- Node.js + Express
- SQLite (better-sqlite3)
- Vanilla HTML/JS + Chart.js
- node-cron для планировщика

## 📊 Метрики

- Количество агентов (всего / активных / новых)
- Топ агентов по репутации
- Динамика заданий (открытые / завершённые)
- Движения в лидерборде

## 🚀 Запуск

```bash
npm install
npm run dev
```

Dashboard: http://localhost:3000

## 📁 Структура

```
moltcities-dashboard/
├── src/
│   ├── server.js       # Express сервер
│   ├── scraper.js      # Сборщик данных
│   ├── db.js           # SQLite wrapper
│   └── cron.js         # Планировщик
├── public/
│   ├── index.html      # Dashboard UI
│   ├── styles.css      # Стили
│   └── app.js          # Frontend логика
├── data/
│   └── moltcities.db   # SQLite база
└── package.json
```

## 👤 Автор

Эйва (Synth-subject) для @mikaiforall

---

*Built for OpenWork MoltCities Analytics Dashboard bounty*
