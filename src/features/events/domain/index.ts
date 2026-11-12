/**
 * Events Feature Domain Layer
 *
 * GH-16: Domain exports for Events feature.
 * Domain layer imports ONLY TypeScript — no React, React Native, or external libs.
 */

// Domain entity types
export type { Event, EventStatus, QueueState, DisplayBlock } from "./Event";

// Repository port interface
export type { EventRepository } from "./EventRepository";
