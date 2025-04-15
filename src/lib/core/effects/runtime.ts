// import * as Effect from '@effect/io/Effect';
// import * as Layer from '@effect/io/Layer';
// import * as Context from '@effect/data/Context';
// import * as Runtime from '@effect/io/Runtime';

// // Runtime configuration type
// export interface RuntimeConfig {
// 	readonly debug: boolean;
// 	readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
// 	readonly cacheEnabled: boolean;
// 	readonly cacheTTL: number;
// }

// // Runtime configuration tag
// export const RuntimeConfigTag = Context.Tag<RuntimeConfig>();

// // Runtime configuration layer
// export const RuntimeConfigLive = Layer.succeed(RuntimeConfigTag, {
// 	debug: process.env.NODE_ENV === 'development',
// 	logLevel: (process.env.LOG_LEVEL || 'info') as RuntimeConfig['logLevel'],
// 	cacheEnabled: process.env.CACHE_ENABLED !== 'false',
// 	cacheTTL: parseInt(process.env.CACHE_TTL || '3600000', 10)
// });

// // Main runtime layer that combines all application layers
// export const MainRuntime = RuntimeConfigLive;

// // Helper to run effects with the main runtime
// export const runWithRuntime = <R, E, A>(effect: Effect.Effect<R, E, A>): Promise<A> => {
// 	const runtime = Runtime.make(Layer.buildWithScope(MainRuntime));
// 	return Runtime.runPromise(runtime)(effect);
// };
