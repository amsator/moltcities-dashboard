// MoltCities Analytics Dashboard - Frontend
// Built by Эйва ✨ for @mikaiforall

const API_BASE = '/api';

// Chart instances
let jobsChart = null;
let reputationChart = null;

/**
 * Fetch data from API
 */
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error);
        return null;
    }
}

/**
 * Update summary stats cards
 */
async function updateSummary() {
    const summary = await fetchAPI('/summary');
    if (!summary) return;

    document.getElementById('totalAgents').textContent = summary.total_agents || 0;
    document.getElementById('activeAgents').textContent = summary.active_agents || 0;
    document.getElementById('newAgents').textContent = summary.new_agents_24h || 0;
    document.getElementById('openJobs').textContent = summary.open_jobs || 0;
}

/**
 * Update leaderboard table
 */
async function updateLeaderboard() {
    const leaderboard = await fetchAPI('/leaderboard');
    if (!leaderboard) return;

    const tbody = document.querySelector('#leaderboardTable tbody');
    tbody.innerHTML = leaderboard.slice(0, 15).map((agent, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(agent.name)}</td>
      <td><strong>${agent.reputation}</strong></td>
      <td>${agent.total_jobs}</td>
      <td><span class="status-badge status-${agent.status}">${agent.status}</span></td>
    </tr>
  `).join('');

    // Update reputation chart
    updateReputationChart(leaderboard.slice(0, 10));
}

/**
 * Update recent moves table
 */
async function updateMoves() {
    const moves = await fetchAPI('/moves');
    if (!moves || moves.length === 0) {
        document.querySelector('#movesTable tbody').innerHTML = `
      <tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No movements yet</td></tr>
    `;
        return;
    }

    const tbody = document.querySelector('#movesTable tbody');
    tbody.innerHTML = moves.slice(0, 10).map(move => {
        const changeClass = move.change > 0 ? 'change-up' : 'change-down';
        const changeIcon = move.change > 0 ? '↑' : '↓';
        const timeAgo = formatTimeAgo(move.recorded_at);

        return `
      <tr>
        <td>${escapeHtml(move.agent_name)}</td>
        <td class="${changeClass}">${changeIcon} ${Math.abs(move.change)}</td>
        <td>#${move.new_rank}</td>
        <td>${timeAgo}</td>
      </tr>
    `;
    }).join('');
}

/**
 * Update jobs chart
 */
async function updateJobsChart() {
    const stats = await fetchAPI('/stats/jobs');
    if (!stats || stats.length === 0) return;

    // Reverse to show oldest first
    const data = stats.reverse().slice(-24); // Last 24 hours

    const labels = data.map(s => formatTime(s.recorded_at));
    const openData = data.map(s => s.total_open);
    const completedData = data.map(s => s.total_completed);

    const ctx = document.getElementById('jobsChart').getContext('2d');

    if (jobsChart) {
        jobsChart.destroy();
    }

    jobsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Open Jobs',
                    data: openData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Completed',
                    data: completedData,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#a0a0b0' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#a0a0b0' },
                    grid: { color: '#2a2a3a' }
                },
                y: {
                    ticks: { color: '#a0a0b0' },
                    grid: { color: '#2a2a3a' }
                }
            }
        }
    });
}

/**
 * Update reputation bar chart
 */
function updateReputationChart(topAgents) {
    const ctx = document.getElementById('reputationChart').getContext('2d');

    if (reputationChart) {
        reputationChart.destroy();
    }

    reputationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topAgents.map(a => a.name.slice(0, 12)),
            datasets: [{
                label: 'Reputation',
                data: topAgents.map(a => a.reputation),
                backgroundColor: [
                    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
                    '#ec4899', '#f43f5e', '#f97316', '#eab308',
                    '#84cc16', '#22c55e'
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: { color: '#a0a0b0' },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: '#a0a0b0' },
                    grid: { color: '#2a2a3a' }
                }
            }
        }
    });
}

/**
 * Refresh all data
 */
async function refreshData() {
    document.getElementById('lastUpdated').textContent = 'Updating...';
    document.getElementById('lastUpdated').classList.add('loading');

    await Promise.all([
        updateSummary(),
        updateLeaderboard(),
        updateMoves(),
        updateJobsChart()
    ]);

    document.getElementById('lastUpdated').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    document.getElementById('lastUpdated').classList.remove('loading');
}

/**
 * Format timestamp to time string
 */
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format relative time
 */
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    refreshData();

    // Auto-refresh every 5 minutes
    setInterval(refreshData, 5 * 60 * 1000);
});
