/**
 * Events Feature Domain Layer
 *
 * GH-17: Domain exports for Events feature.
 * Domain layer imports ONLY TypeScript — no React, React Native, or external libs.
 *
 * Evolution from GH-16: EventStatus removed (not in GET /events response).
 */

// Domain entity types
export type { Event, QueueState, DisplayBlock } from "./Event";

// Repository port interface
export type { EventRepository } from "./EventRepository";
