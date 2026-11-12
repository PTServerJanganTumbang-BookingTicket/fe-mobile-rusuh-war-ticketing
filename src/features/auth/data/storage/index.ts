/**
 * Auth Token Storage
 *
 * GH-6: Storage layer for auth tokens.
 *
 * @module features/auth/data/storage
 */

export type { StorageResult, TokenStorage } from "./token-storage.port";
export {
  TokenStorageService,
  createTokenStorage,
} from "./token-storage.service";
