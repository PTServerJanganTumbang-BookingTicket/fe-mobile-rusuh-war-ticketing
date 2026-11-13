/**
 * Handoff DTOs
 *
 * GH-14 T4: Data transfer objects for payment handoff endpoints.
 * ADR-007 §5.6, §5.7
 *
 * @module features/payment/data/dto/handoff.dto
 */

/**
 * Response from POST /payments/{booking_id}/handoff
 *
 * ADR-007: "201 { handoff_code, payment_url, expires_at }"
 */
export interface HandoffResponseDto {
  /** One-time handoff code (hc_..., 256-bit, 60s TTL) */
  handoff_code: string;
  /** Full payment URL with #code fragment */
  payment_url: string;
  /** ISO 8601 timestamp when handoff_code expires */
  expires_at: string;
}

/**
 * Domain model for handoff response.
 */
export interface HandoffResponse {
  /** One-time handoff code (hc_...) */
  handoffCode: string;
  /** Full payment URL including #code=handoff_code */
  paymentUrl: string;
  /** ISO 8601 timestamp when code expires (60 seconds from creation) */
  expiresAt: string;
}

/**
 * Map API response to domain model.
 */
export function mapHandoffResponse(dto: HandoffResponseDto): HandoffResponse {
  return {
    handoffCode: dto.handoff_code,
    paymentUrl: dto.payment_url,
    expiresAt: dto.expires_at,
  };
}

/**
 * Response from POST /payments/handoff/exchange
 * (Used by WebView, not mobile app directly)
 *
 * ADR-007: "200 { payment_session, expires_at }"
 */
export interface ExchangeResponseDto {
  /** Payment session token (ps_..., 256-bit) */
  payment_session: string;
  /** ISO 8601 timestamp when session expires */
  expires_at: string;
}

/**
 * Type guard for HandoffResponseDto.
 */
export function isValidHandoffResponseDto(
  value: unknown
): value is HandoffResponseDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const dto = value as Record<string, unknown>;

  return (
    typeof dto.handoff_code === "string" &&
    typeof dto.payment_url === "string" &&
    typeof dto.expires_at === "string"
  );
}
