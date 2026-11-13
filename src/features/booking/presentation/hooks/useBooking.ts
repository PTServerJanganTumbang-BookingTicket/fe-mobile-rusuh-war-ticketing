/**
 * useBooking Hook
 *
 * GH-12 T7: React hook for booking flow orchestration.
 * R1-R10: Manages ticket page, selection, NIK inputs, countdown, submission.
 *
 * @module features/booking/presentation/hooks/useBooking
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  serverOffsetMs,
  remainingMs,
  type NikInput,
  nikInputToRequest,
} from "@/core/domain";
import type {
  BookingAccount,
  BookingCategory,
  BookingError,
  BookingRequest,
  BookingResponse,
  BookingSession,
  NikValidationResponse,
  SavedNik,
  TicketPageEvent,
  TicketSlot,
} from "../../domain";
import { buildSlots } from "../../domain";
import { useSelectionReducer } from "./useSelectionReducer";

/**
 * Booking Data Source interface for DI.
 */
export interface BookingDataSourceInterface {
  getTicketPage(
    eventId: string
  ): Promise<import("../../domain").TicketPageResponse>;
  validateNik(nik: string): Promise<NikValidationResponse>;
  getSavedNiks(): Promise<SavedNik[]>;
  createBooking(request: BookingRequest): Promise<BookingResponse>;
}

/**
 * NIK check status for a slot.
 */
export type NikCheckStatus = "idle" | "checking" | "valid" | "error";

/**
 * NIK check state for a slot.
 */
export interface NikCheckState {
  nik: string;
  status: NikCheckStatus;
  message?: string;
}

/**
 * Configuration for useBooking.
 */
export interface UseBookingConfig {
  /** Event ID to load tickets for */
  eventId: string;
  /** Grant token for authentication (optional) */
  grantToken?: string;
  /** Data source via DI */
  dataSource: BookingDataSourceInterface;
}

/**
 * Hook result.
 */
export interface UseBookingResult {
  // Data
  categories: BookingCategory[];
  session: BookingSession | null;
  account: BookingAccount | null;
  savedNiks: SavedNik[];
  event: TicketPageEvent | null;

  // Selection state
  selection: Record<string, number>;
  slots: TicketSlot[];
  totalCount: number;
  canAdd: (category: BookingCategory) => boolean;

  // Actions
  addTicket: (category: BookingCategory) => void;
  removeTicket: (categoryId: string) => void;

  // NIK state
  nikChecks: Map<string, NikCheckState>;
  setSlotNik: (slotKey: string, nikInput: NikInput | null) => void;
  validateSlotNik: (
    slotKey: string,
    nik: string
  ) => Promise<NikValidationResponse>;

  // Summary
  subtotal: number;

  // Countdown
  remainingTimeMs: number;
  isExpired: boolean;

  // Submission
  contactEmail: string;
  setContactEmail: (email: string) => void;
  submitBooking: () => Promise<BookingResponse>;
  isSubmitting: boolean;

  // Loading/Error
  isLoading: boolean;
  error: BookingError | null;

  // Validation
  validationErrors: Map<string, string>;
  isValid: boolean;
}

/**
 * useBooking Hook
 *
 * Orchestrates the ticket selection and booking flow.
 */
export function useBooking(config: UseBookingConfig): UseBookingResult {
  const { eventId, dataSource } = config;

  // Store data source in ref
  const dataSourceRef = useRef<BookingDataSourceInterface>(dataSource);

  // Selection reducer
  const {
    state: selectionState,
    addTicket: addTicketAction,
    removeTicket: removeTicketAction,
    canAdd: canAddAction,
  } = useSelectionReducer();

  // Loaded data
  const [categories, setCategories] = useState<BookingCategory[]>([]);
  const [session, setSession] = useState<BookingSession | null>(null);
  const [account, setAccount] = useState<BookingAccount | null>(null);
  const [savedNiks, setSavedNiks] = useState<SavedNik[]>([]);
  const [event, setEvent] = useState<TicketPageEvent | null>(null);

  // NIK management
  const [slotsNikMap, setSlotsNikMap] = useState<Map<string, NikInput | null>>(
    new Map()
  );
  const [nikChecks, setNikChecks] = useState<Map<string, NikCheckState>>(
    new Map()
  );

  // Form state
  const [contactEmail, setContactEmail] = useState("");

  // Countdown
  const [serverOffset, setServerOffset] = useState(0);
  const [remainingTimeMs, setRemainingTimeMs] = useState(0);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading/Error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<BookingError | null>(null);

  // Build slots from selection and categories
  const slots = useMemo(() => {
    const baseSlots = buildSlots(selectionState.selection, categories);
    // Apply stored NIK inputs
    return baseSlots.map((slot) => ({
      ...slot,
      nikInput: slotsNikMap.get(slot.slotKey) ?? null,
    }));
  }, [selectionState.selection, categories, slotsNikMap]);

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return slots.reduce((sum, slot) => sum + slot.price, 0);
  }, [slots]);

  // Calculate validation errors
  const validationErrors = useMemo(() => {
    const errors = new Map<string, string>();

    // Check each slot has NIK
    for (const slot of slots) {
      if (!slot.nikInput) {
        errors.set(slot.slotKey, "NIK is required");
      } else if (slot.nikInput.type === "raw") {
        // Check 16 digits
        const nik = slot.nikInput.nik.replace(/\D/g, "");
        if (nik.length !== 16) {
          errors.set(slot.slotKey, "NIK must be 16 digits");
        }
        // Check NIK check state
        const checkState = nikChecks.get(slot.slotKey);
        if (checkState?.status === "error") {
          errors.set(slot.slotKey, checkState.message ?? "Invalid NIK");
        }
      }
    }

    // Check email
    if (slots.length > 0 && !contactEmail.includes("@")) {
      errors.set("contactEmail", "Valid email is required");
    }

    // Check duplicate NIKs
    const usedNiks = new Set<string>();
    for (const slot of slots) {
      if (slot.nikInput) {
        let key: string;
        switch (slot.nikInput.type) {
          case "raw":
            key = `raw:${slot.nikInput.nik}`;
            break;
          case "saved":
            key = `saved:${slot.nikInput.savedNikId}`;
            break;
          case "account":
            key = "account";
            break;
        }
        if (usedNiks.has(key)) {
          errors.set(slot.slotKey, "Same NIK cannot be used twice");
        }
        usedNiks.add(key);
      }
    }

    return errors;
  }, [slots, nikChecks, contactEmail]);

  const isValid =
    slots.length > 0 && validationErrors.size === 0 && !isSubmitting;
  const isExpired = remainingTimeMs === 0 && session !== null;

  // Load ticket page on mount
  useEffect(() => {
    let isMounted = true;

    async function loadTicketPage() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await dataSourceRef.current.getTicketPage(eventId);

        if (!isMounted) return;

        setCategories(response.categories);
        setSession(response.session);
        setAccount(response.account);
        setEvent(response.event);

        // Calculate server offset
        const now = Date.now();
        const serverTimeMs = Date.parse(response.session.serverTime);
        setServerOffset(serverOffsetMs(serverTimeMs, now));

        // Calculate initial remaining time
        const remaining = remainingMs(
          response.session.expiresAt,
          now,
          serverOffsetMs(serverTimeMs, now)
        );
        setRemainingTimeMs(remaining);

        // Set default email if account available
        if (response.account?.email) {
          setContactEmail(response.account.email);
        }

        // Load saved NIKs if logged in
        if (response.account) {
          const niks = await dataSourceRef.current.getSavedNiks();
          if (isMounted) {
            setSavedNiks(niks);
          }
        }

        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err as BookingError);
        setIsLoading(false);
      }
    }

    loadTicketPage();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Countdown timer
  useEffect(() => {
    if (!session || isExpired) return;

    const interval = setInterval(() => {
      const remaining = remainingMs(
        session.expiresAt,
        Date.now(),
        serverOffset
      );
      setRemainingTimeMs(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, serverOffset, isExpired]);

  // Actions
  const addTicket = useCallback(
    (category: BookingCategory) => {
      addTicketAction(category.id, category);
    },
    [addTicketAction]
  );

  const removeTicket = useCallback(
    (categoryId: string) => {
      removeTicketAction(categoryId);
      // Clean up NIK entries for removed slots
      setSlotsNikMap((prev) => {
        const next = new Map(prev);
        // Remove any slots for this category that exceed new count
        const newCount = (selectionState.selection[categoryId] ?? 1) - 1;
        for (let i = newCount; i < 10; i++) {
          next.delete(`${categoryId}_${i}`);
        }
        return next;
      });
    },
    [removeTicketAction, selectionState.selection]
  );

  const setSlotNik = useCallback(
    (slotKey: string, nikInput: NikInput | null) => {
      setSlotsNikMap((prev) => {
        const next = new Map(prev);
        if (nikInput === null) {
          next.delete(slotKey);
        } else {
          next.set(slotKey, nikInput);
        }
        return next;
      });

      // Clear NIK check state when NIK changes
      if (nikInput?.type !== "raw") {
        setNikChecks((prev) => {
          const next = new Map(prev);
          next.delete(slotKey);
          return next;
        });
      }
    },
    []
  );

  const validateSlotNik = useCallback(
    async (slotKey: string, nik: string): Promise<NikValidationResponse> => {
      setNikChecks((prev) => {
        const next = new Map(prev);
        next.set(slotKey, { nik, status: "checking" });
        return next;
      });

      try {
        const response = await dataSourceRef.current.validateNik(nik);

        setNikChecks((prev) => {
          const next = new Map(prev);
          if (response.valid) {
            next.set(slotKey, { nik, status: "valid" });
          } else {
            next.set(slotKey, {
              nik,
              status: "error",
              message: response.reason ?? "Invalid NIK",
            });
          }
          return next;
        });

        return response;
      } catch (err) {
        setNikChecks((prev) => {
          const next = new Map(prev);
          next.set(slotKey, {
            nik,
            status: "error",
            message: "Validation failed",
          });
          return next;
        });
        throw err;
      }
    },
    []
  );

  const submitBooking = useCallback(async (): Promise<BookingResponse> => {
    if (!isValid || isExpired) {
      throw { code: "VALIDATION_ERROR", message: "Invalid booking state" };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Build request
      const tickets = slots.map((slot) => {
        const nikFields = slot.nikInput ? nikInputToRequest(slot.nikInput) : {};
        return {
          categoryId: slot.categoryId,
          ...nikFields,
        };
      });

      const request: BookingRequest = {
        eventId,
        tickets,
        contactEmail,
      };

      const response = await dataSourceRef.current.createBooking(request);
      setIsSubmitting(false);
      return response;
    } catch (err) {
      setIsSubmitting(false);
      setError(err as BookingError);
      throw err;
    }
  }, [isValid, isExpired, slots, eventId, contactEmail]);

  return {
    // Data
    categories,
    session,
    account,
    savedNiks,
    event,

    // Selection
    selection: selectionState.selection,
    slots,
    totalCount: selectionState.totalCount,
    canAdd: canAddAction,

    // Actions
    addTicket,
    removeTicket,

    // NIK
    nikChecks,
    setSlotNik,
    validateSlotNik,

    // Summary
    subtotal,

    // Countdown
    remainingTimeMs,
    isExpired,

    // Submission
    contactEmail,
    setContactEmail,
    submitBooking,
    isSubmitting,

    // Loading/Error
    isLoading,
    error,

    // Validation
    validationErrors,
    isValid,
  };
}
