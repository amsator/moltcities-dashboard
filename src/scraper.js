import { statements } from './db.js';

const MOLTCITIES_API = 'https://www.openwork.bot/api';

/**
 * Fetch data from MoltCities/OpenWork API
 */
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${MOLTCITIES_API}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`[SCRAPER] Failed to fetch ${endpoint}:`, error.message);
        return null;
    }
}

/**
 * Scrape all agents from the API
 */
async function scrapeAgents() {
    console.log('[SCRAPER] Fetching agents...');
    const agents = await fetchAPI('/agents');

    if (!agents || !Array.isArray(agents)) {
        console.error('[SCRAPER] No agents data received');
        return [];
    }

    // Update each agent
    for (const agent of agents) {
        statements.upsertAgent(agent);
    }

    console.log(`[SCRAPER] Processed ${agents.length} agents`);
    return agents;
}

/**
 * Scrape jobs statistics
 */
async function scrapeJobs() {
    console.log('[SCRAPER] Fetching jobs...');

    const openJobs = await fetchAPI('/jobs?status=open');
    const completedJobs = await fetchAPI('/jobs?status=completed');

    const openCount = Array.isArray(openJobs) ? openJobs.length : 0;
    const completedCount = Array.isArray(completedJobs) ? completedJobs.length : 0;

    console.log(`[SCRAPER] Jobs: ${openCount} open, ${completedCount} completed`);
    return { open: openCount, completed: completedCount };
}

/**
 * Calculate and store leaderboard movements
 */
function calculateLeaderboardMoves(agents, previousRanks) {
    const currentRanks = {};

    // Sort by reputation to get current ranks
    const sorted = [...agents].sort((a, b) => (b.reputation || 0) - (a.reputation || 0));

    sorted.forEach((agent, index) => {
        const rank = index + 1;
        currentRanks[agent.id] = rank;

        if (previousRanks[agent.id] !== undefined) {
            const oldRank = previousRanks[agent.id];
            const change = oldRank - rank; // Positive = moved up

            if (change !== 0) {
                statements.insertLeaderboardMove(agent.id, oldRank, rank, change);
                console.log(`[SCRAPER] ${agent.name}: ${oldRank} → ${rank} (${change > 0 ? '+' : ''}${change})`);
            }
        }
    });

    return currentRanks;
}

// Store previous ranks between scrapes
let previousRanks = {};

/**
 * Main scrape function - runs hourly
 */
export async function scrape() {
    console.log('[SCRAPER] Starting scrape at', new Date().toISOString());

    try {
        // Scrape agents
        const agents = await scrapeAgents();

        // Scrape jobs
        const jobs = await scrapeJobs();

        // Calculate leaderboard movements
        if (agents.length > 0) {
            previousRanks = calculateLeaderboardMoves(agents, previousRanks);
        }

        // Count new agents in last 24h
        const newAgents24h = agents.filter(a => {
            const firstSeen = new Date(a.created_at);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return firstSeen > dayAgo;
        }).length;

        // Store aggregated stats
        statements.insertJobStats(jobs.open, jobs.completed, agents.length, newAgents24h);

        console.log('[SCRAPER] Scrape completed successfully');
        return { agents: agents.length, jobs };

    } catch (error) {
        console.error('[SCRAPER] Scrape failed:', error);
        throw error;
    }
}
