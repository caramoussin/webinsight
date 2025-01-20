import { FeedService } from './feed-service';

class BackgroundJobScheduler {
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
}

// Singleton instance for easy import and use
export const backgroundJobScheduler = new BackgroundJobScheduler();
