// import * as Effect from '@effect/io/Effect';
// import * as Layer from '@effect/io/Layer';
// import * as Context from '@effect/data/Context';
// import type { AppError } from './errors';
// import type { RuntimeConfig } from './runtime';

// // Base interface for all services
// export interface BaseService {
// 	readonly _tag: string;
// 	readonly config: RuntimeConfig;
// }

// // Type helper for service effects
// export type ServiceEffect<S extends BaseService, E extends AppError, A> = Effect.Effect<S, E, A>;

// // Helper to create service tags
// export const createServiceTag = <S extends BaseService>(name: string) => Context.Tag<S>(name);

// // Helper to create service layers
// export const createServiceLayer = <S extends BaseService>(
// 	tag: Context.Tag<S, S>,
// 	implementation: (config: RuntimeConfig) => S
// ): Layer.Layer<RuntimeConfig, never, S> =>
// 	Layer.effect(tag, Effect.map(Effect.get(Context.Tag<RuntimeConfig>()), implementation));

// // Helper to provide a service to an effect
// export const provideService = <R, E, A, S extends BaseService>(
// 	effect: Effect.Effect<R | S, E, A>,
// 	service: S
// ): Effect.Effect<R, E, A> =>
// 	Effect.provide(effect, Context.make(Context.Tag<S>(service._tag), service));
