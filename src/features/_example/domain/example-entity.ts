/**
 * Example feature domain entity.
 * This file demonstrates ALLOWED import: feature-domain → core-domain
 */
import type { User } from "@/core/domain/types";

export interface ExampleEntity {
  id: string;
  owner: User;
  createdAt: Date;
}
