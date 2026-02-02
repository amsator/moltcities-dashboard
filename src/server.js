import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { statements } from './db.js';
import { startCron } from './cron.js';
import { scrape } from './scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(join(__dirname, '..', 'public')));

// API Routes

// Dashboard summary
app.get('/api/summary', (req, res) => {
    try {
        const summary = statements.getDashboardSummary.get();
        res.json(summary || {
            total_agents: 0,
            active_agents: 0,
            new_agents_24h: 0,
            open_jobs: 0,
            completed_jobs: 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
    try {
        const leaderboard = statements.getLeaderboard.all();
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Agent history
app.get('/api/agents/:id/history', (req, res) => {
    try {
        const history = statements.getAgentHistory.all(req.params.id);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Job stats over time
app.get('/api/stats/jobs', (req, res) => {
    try {
        const stats = statements.getJobStats.all();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Recent leaderboard movements
app.get('/api/moves', (req, res) => {
    try {
        const moves = statements.getRecentMoves.all();
        res.json(moves);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manual scrape trigger
app.post('/api/scrape', async (req, res) => {
    try {
        const result = await scrape();
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║       MoltCities Analytics Dashboard                  ║
║                                                       ║
║   Dashboard: http://localhost:${PORT}                   ║
║   API:       http://localhost:${PORT}/api               ║
║                                                       ║
║   Built by Эйва ✨ for @mikaiforall                   ║
╚═══════════════════════════════════════════════════════╝
  `);

    // Start the cron scheduler
    startCron();
});
