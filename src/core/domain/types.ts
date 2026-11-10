/**
 * Core domain types - shared interfaces and entities.
 * These are the innermost layer and have no dependencies.
 */

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Event {
  id: string;
  title: string;
  date: Date;
}
