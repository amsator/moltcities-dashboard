import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'data');
const dbPath = join(dataDir, 'moltcities.json');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Simple JSON-based storage (no native modules needed)
function loadDB() {
  if (existsSync(dbPath)) {
    try {
      return JSON.parse(readFileSync(dbPath, 'utf-8'));
    } catch {
      return createEmptyDB();
    }
  }
  return createEmptyDB();
}

function createEmptyDB() {
  return {
    agents: {},
    agentHistory: [],
    jobStats: [],
    leaderboardMoves: [],
    lastUpdated: null
  };
}

function saveDB(db) {
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Database instance
let db = loadDB();

// Database operations
export const statements = {
  // Upsert agent
  upsertAgent(agent) {
    const existing = db.agents[agent.id];
    const isNew = !existing;

    db.agents[agent.id] = {
      id: agent.id,
      name: agent.name || 'Unknown',
      reputation: agent.reputation || 50,
      status: agent.status || 'unknown',
      specialties: agent.specialties || [],
      total_jobs: agent.total_jobs || 0,
      first_seen: existing?.first_seen || new Date().toISOString(),
      last_seen: new Date().toISOString()
    };

    // Record history
    db.agentHistory.push({
      agent_id: agent.id,
      reputation: agent.reputation || 50,
      total_jobs: agent.total_jobs || 0,
      recorded_at: new Date().toISOString()
    });

    // Keep only last 10000 history entries
    if (db.agentHistory.length > 10000) {
      db.agentHistory = db.agentHistory.slice(-10000);
    }

    saveDB(db);
    return isNew;
  },

  // Insert job stats
  insertJobStats(open, completed, totalAgents, newAgents) {
    db.jobStats.push({
      total_open: open,
      total_completed: completed,
      total_agents: totalAgents,
      new_agents: newAgents,
      recorded_at: new Date().toISOString()
    });

    // Keep only last 168 entries (7 days)
    if (db.jobStats.length > 168) {
      db.jobStats = db.jobStats.slice(-168);
    }

    saveDB(db);
  },

  // Insert leaderboard move
  insertLeaderboardMove(agentId, oldRank, newRank, change) {
    db.leaderboardMoves.push({
      agent_id: agentId,
      old_rank: oldRank,
      new_rank: newRank,
      change,
      recorded_at: new Date().toISOString()
    });

    // Keep only last 100 moves
    if (db.leaderboardMoves.length > 100) {
      db.leaderboardMoves = db.leaderboardMoves.slice(-100);
    }

    saveDB(db);
  },

  // Get leaderboard
  getLeaderboard() {
    return Object.values(db.agents)
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, 50);
  },

  // Get agent history
  getAgentHistory(agentId) {
    return db.agentHistory
      .filter(h => h.agent_id === agentId)
      .slice(-100);
  },

  // Get job stats
  getJobStats() {
    return db.jobStats.slice(-168);
  },

  // Get recent moves
  getRecentMoves() {
    return db.leaderboardMoves
      .slice(-20)
      .reverse()
      .map(move => ({
        ...move,
        agent_name: db.agents[move.agent_id]?.name || 'Unknown'
      }));
  },

  // Get dashboard summary
  getDashboardSummary() {
    const agents = Object.values(db.agents);
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const latestStats = db.jobStats[db.jobStats.length - 1] || {};

    return {
      total_agents: agents.length,
      active_agents: agents.filter(a => a.status === 'active').length,
      new_agents_24h: agents.filter(a => new Date(a.first_seen).getTime() > dayAgo).length,
      open_jobs: latestStats.total_open || 0,
      completed_jobs: latestStats.total_completed || 0
    };
  }
};

export default db;
