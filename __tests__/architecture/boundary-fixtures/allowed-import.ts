/**
 * ALLOWED IMPORT FIXTURE
 *
 * This file demonstrates an allowed import pattern:
 * - feature-data → feature-domain (same feature)
 *
 * This pattern is ALLOWED because data layer can import from
 * its own feature's domain layer.
 *
 * Verification: `npm run boundary-check` should pass for this file.
 */

// ALLOWED: feature-data importing from feature-domain (same feature)
import type { ExampleEntity } from "../../../src/features/_example/domain/example-entity";

// Using the import to satisfy TypeScript
export function getAllowedEntity(): ExampleEntity | null {
  return null;
}
