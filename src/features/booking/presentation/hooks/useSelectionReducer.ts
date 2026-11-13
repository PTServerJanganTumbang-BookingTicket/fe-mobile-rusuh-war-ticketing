/**
 * Selection Reducer Hook
 *
 * GH-12 T7: Reducer pattern for ticket selection state.
 * ADR-2: Follows FE-Web selection reducer pattern.
 *
 * @module features/booking/presentation/hooks/useSelectionReducer
 */

import { useReducer, useCallback } from "react";
import type { BookingCategory, TicketSelection } from "../../domain";
import {
  canAddTicket,
  canRemoveTicket,
  totalSelectedCount,
} from "../../domain";

/**
 * Selection state.
 */
export interface SelectionState {
  /** Selection map: categoryId -> quantity */
  selection: TicketSelection;
  /** Total count across all categories */
  totalCount: number;
}

/**
 * Selection actions.
 */
export type SelectionAction =
  | { type: "ADD_TICKET"; categoryId: string; category: BookingCategory }
  | { type: "REMOVE_TICKET"; categoryId: string }
  | { type: "RESET" };

/**
 * Initial selection state.
 */
const initialState: SelectionState = {
  selection: {},
  totalCount: 0,
};

/**
 * Selection reducer.
 */
function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case "ADD_TICKET": {
      // Validate with canAddTicket before updating
      if (!canAddTicket(state.selection, action.category)) {
        return state; // No change if can't add
      }

      const currentCount = state.selection[action.categoryId] ?? 0;
      const newSelection = {
        ...state.selection,
        [action.categoryId]: currentCount + 1,
      };

      return {
        selection: newSelection,
        totalCount: totalSelectedCount(newSelection),
      };
    }

    case "REMOVE_TICKET": {
      // Validate with canRemoveTicket before updating
      if (!canRemoveTicket(state.selection, action.categoryId)) {
        return state; // No change if can't remove
      }

      const currentCount = state.selection[action.categoryId] ?? 0;
      const newCount = currentCount - 1;
      const newSelection = { ...state.selection };

      if (newCount <= 0) {
        delete newSelection[action.categoryId];
      } else {
        newSelection[action.categoryId] = newCount;
      }

      return {
        selection: newSelection,
        totalCount: totalSelectedCount(newSelection),
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

/**
 * Hook result.
 */
export interface UseSelectionReducerResult {
  /** Current selection state */
  state: SelectionState;
  /** Add ticket to category */
  addTicket: (categoryId: string, category: BookingCategory) => void;
  /** Remove ticket from category */
  removeTicket: (categoryId: string) => void;
  /** Reset selection */
  reset: () => void;
  /** Check if can add ticket to category */
  canAdd: (category: BookingCategory) => boolean;
  /** Check if can remove ticket from category */
  canRemove: (categoryId: string) => boolean;
}

/**
 * Selection reducer hook.
 *
 * ADR-2: Uses reducer pattern from FE-Web.
 */
export function useSelectionReducer(): UseSelectionReducerResult {
  const [state, dispatch] = useReducer(selectionReducer, initialState);

  const addTicket = useCallback(
    (categoryId: string, category: BookingCategory) => {
      dispatch({ type: "ADD_TICKET", categoryId, category });
    },
    []
  );

  const removeTicket = useCallback((categoryId: string) => {
    dispatch({ type: "REMOVE_TICKET", categoryId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const canAdd = useCallback(
    (category: BookingCategory) => canAddTicket(state.selection, category),
    [state.selection]
  );

  const canRemove = useCallback(
    (categoryId: string) => canRemoveTicket(state.selection, categoryId),
    [state.selection]
  );

  return {
    state,
    addTicket,
    removeTicket,
    reset,
    canAdd,
    canRemove,
  };
}
