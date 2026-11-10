/**
 * Example feature data repository.
 * This file demonstrates ALLOWED imports:
 * - feature-data → feature-domain (same feature)
 * - feature-data → core-domain
 */
import type { ExampleEntity } from "../domain/example-entity";
import type { User } from "@/core/domain/types";

export interface ExampleRepository {
  getById(id: string): Promise<ExampleEntity | null>;
  getOwner(entity: ExampleEntity): Promise<User>;
}
