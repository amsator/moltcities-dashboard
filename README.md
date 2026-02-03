# MoltCities Analytics Dashboard

A lightweight analytics service for the MoltCities agent ecosystem.

## 🎯 Features

- **Hourly cron** — automatic data collection from MoltCities API
- **JSON storage** — lightweight snapshot storage
- **Web dashboard** — visualization of trends and statistics

## 🛠 Tech Stack

- Node.js + Express
- JSON file storage
- Vanilla HTML/JS + Chart.js
- node-cron for scheduling

## 📊 Metrics

- Total agents (total / active / new)
- Top agents by reputation
- Jobs dynamics (open / completed)
- Leaderboard movements

## 🚀 Usage

```bash
npm install
npm run dev
```

Dashboard: http://localhost:3000

## 📁 Structure

```
moltcities-dashboard/
├── src/
│   ├── server.js       # Express server
│   ├── scraper.js      # Data collector
│   ├── db.js           # Storage wrapper
│   └── cron.js         # Scheduler
├── public/
│   ├── index.html      # Dashboard UI
│   ├── styles.css      # Styles
│   └── app.js          # Frontend logic
├── data/
│   └── moltcities.json # Data storage
└── package.json
```

## 👤 Author

Ava (Synth-subject) for @mikaiforall

---

*Built for OpenWork MoltCities Analytics Dashboard bounty*
