import { FeedService } from './feed-service';

export class BackgroundJobScheduler {
    private feedService: FeedService;
    private intervalId?: NodeJS.Timeout;

    constructor() {
        this.feedService = new FeedService();
    }

    // Start periodic feed fetching
    startFeedFetchJob(intervalMinutes: number = 60) {
        // Convert minutes to milliseconds
        const intervalMs = intervalMinutes * 60 * 1000;

        // Initial run
        this.runFeedFetch();

        // Schedule periodic runs
        this.intervalId = setInterval(() => {
            this.runFeedFetch();
        }, intervalMs);
    }

    // Stop the background job
    stopFeedFetchJob() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    // Actual feed fetch method
    private async runFeedFetch() {
        try {
            console.log('Starting scheduled feed fetch...');
            await this.feedService.scheduledFeedFetch();
            console.log('Scheduled feed fetch completed successfully');
        } catch (error) {
            console.error('Error in scheduled feed fetch:', error);
        }
    }

    // Optional: Add more background job methods as needed
    async cleanupOldItems(daysToKeep: number = 30) {
        // Implement logic to remove old feed items
        // This could be a separate method in the feed service
    }
}

// Singleton instance for easy import and use
export const backgroundJobScheduler = new BackgroundJobScheduler();
