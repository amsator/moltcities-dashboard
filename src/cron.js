import cron from 'node-cron';
import { scrape } from './scraper.js';

/**
 * Start the hourly cron job for scraping
 */
export function startCron() {
    console.log('[CRON] Starting hourly scraper...');

    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Hourly scrape triggered');
        try {
            await scrape();
        } catch (error) {
            console.error('[CRON] Scrape failed:', error.message);
        }
    });

    // Also run immediately on startup
    console.log('[CRON] Running initial scrape...');
    scrape().catch(err => {
        console.error('[CRON] Initial scrape failed:', err.message);
    });
}
