import { backgroundJobScheduler } from '$lib/server/background-jobs';
import type { Handle } from '@sveltejs/kit';

// Server-side initialization hook
export const handle: Handle = async ({ event, resolve }) => {
    // Start background jobs when the server starts
    backgroundJobScheduler.startFeedFetchJob(60); // Run every hour

    // You can add more server-side initialization logic here
    const response = await resolve(event);
    return response;
};
