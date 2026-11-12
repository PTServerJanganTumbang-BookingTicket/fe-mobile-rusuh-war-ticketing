/**
 * Auth Mappers Barrel Export
 *
 * GH-6: DTO to domain mappers.
 *
 * @module features/auth/data/mappers
 */

export {
  mapVerifyResponse,
  extractRefreshToken,
} from "./verify-response.mapper";

export {
  mapRefreshResponse,
  extractRefreshTokenFromRefresh,
} from "./refresh-response.mapper";

export { mapRegisterResponse } from "./register-response.mapper";

export {
  mapErrorResponse,
  createNetworkError,
  createStorageError,
} from "./error.mapper";
