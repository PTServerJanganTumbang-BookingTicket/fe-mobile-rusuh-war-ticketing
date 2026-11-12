/**
 * NIK Validation Unit Tests
 *
 * Tests for validateNikInput covering all valid and invalid cases.
 * R8-AC2: Zero NIK fields -> error
 * R8-AC3: Multiple NIK fields -> error
 * R8-AC4: Exactly one NIK field -> valid
 * R8-AC5: NIK normalization tests
 * R16-AC2: NIK exactly-one-of validation has unit tests
 *
 * @module __tests__/core/domain/booking/nik.test
 */

import {
  isValidNikFormat,
  nikInputToRequest,
  normalizeNik,
  validateNikInput,
} from "@/core/domain";

describe("normalizeNik", () => {
  it("strips non-digit characters", () => {
    const result = normalizeNik("12.34-56 78-90 12 34.56");

    expect(result).toBe("1234567890123456");
  });

  it("preserves digits-only input", () => {
    const result = normalizeNik("1234567890123456");

    expect(result).toBe("1234567890123456");
  });

  it("handles empty string", () => {
    const result = normalizeNik("");

    expect(result).toBe("");
  });

  it("removes all non-digits from mixed input", () => {
    const result = normalizeNik("NIK: 32-01-15-280100-0001");

    expect(result).toBe("3201152801000001");
  });
});

describe("isValidNikFormat", () => {
  it("returns true for exactly 16 digits", () => {
    expect(isValidNikFormat("1234567890123456")).toBe(true);
  });

  it("returns true for 16 digits with formatting", () => {
    expect(isValidNikFormat("12.34.56.78.90.12.34.56")).toBe(true);
  });

  it("returns false for less than 16 digits", () => {
    expect(isValidNikFormat("123456789012345")).toBe(false);
  });

  it("returns false for more than 16 digits", () => {
    expect(isValidNikFormat("12345678901234567")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidNikFormat("")).toBe(false);
  });
});

describe("validateNikInput", () => {
  describe("R8-AC2: Zero NIK fields -> error", () => {
    it("returns NIK_MISSING for empty object", () => {
      const result = validateNikInput({});

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe("NIK_MISSING");
      }
    });

    it("returns NIK_MISSING for all undefined fields", () => {
      const result = validateNikInput({
        nik: undefined,
        savedNikId: undefined,
        useAccountNik: undefined,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe("NIK_MISSING");
      }
    });

    it("returns NIK_MISSING for empty string nik", () => {
      const result = validateNikInput({ nik: "" });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe("NIK_MISSING");
      }
    });

    it("returns NIK_MISSING for false useAccountNik", () => {
      const result = validateNikInput({ useAccountNik: false });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe("NIK_MISSING");
      }
    });
  });

  describe("R8-AC3: Multiple NIK fields -> error", () => {
    it("returns NIK_MULTIPLE for nik + savedNikId", () => {
      const result = validateNikInput({
        nik: "1234567890123456",
        savedNikId: "saved-id-123",
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe("NIK_MULTIPLE");
      }
    });

    it("returns NIK_MULTIPLE for nik + useAccountNik", () => {
      const result = validateNikInput({
        nik: "1234567890123456",
        useAccountNik: true,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe("NIK_MULTIPLE");
      }
    });

    it("returns NIK_MULTIPLE for savedNikId + useAccountNik", () => {
      const result = validateNikInput({
        savedNikId: "saved-id-123",
        useAccountNik: true,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe("NIK_MULTIPLE");
      }
    });

    it("returns NIK_MULTIPLE for all three fields", () => {
      const result = validateNikInput({
        nik: "1234567890123456",
        savedNikId: "saved-id-123",
        useAccountNik: true,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe("NIK_MULTIPLE");
      }
    });
  });

  describe("R8-AC4: Exactly one NIK field -> valid", () => {
    it("validates raw nik input", () => {
      const result = validateNikInput({ nik: "1234567890123456" });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.input.type).toBe("raw");
        if (result.input.type === "raw") {
          expect(result.input.nik).toBe("1234567890123456");
        }
      }
    });

    it("validates savedNikId input", () => {
      const result = validateNikInput({ savedNikId: "saved-id-123" });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.input.type).toBe("saved");
        if (result.input.type === "saved") {
          expect(result.input.savedNikId).toBe("saved-id-123");
        }
      }
    });

    it("validates useAccountNik input", () => {
      const result = validateNikInput({ useAccountNik: true });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.input.type).toBe("account");
        if (result.input.type === "account") {
          expect(result.input.useAccountNik).toBe(true);
        }
      }
    });
  });
});

describe("nikInputToRequest", () => {
  it("converts raw NIK input to request", () => {
    const result = nikInputToRequest({ type: "raw", nik: "1234567890123456" });

    expect(result).toEqual({ nik: "1234567890123456" });
    expect(result.saved_nik_id).toBeUndefined();
    expect(result.use_account_nik).toBeUndefined();
  });

  it("converts saved NIK input to request", () => {
    const result = nikInputToRequest({
      type: "saved",
      savedNikId: "saved-id-123",
    });

    expect(result).toEqual({ saved_nik_id: "saved-id-123" });
    expect(result.nik).toBeUndefined();
    expect(result.use_account_nik).toBeUndefined();
  });

  it("converts account NIK input to request", () => {
    const result = nikInputToRequest({ type: "account", useAccountNik: true });

    expect(result).toEqual({ use_account_nik: true });
    expect(result.nik).toBeUndefined();
    expect(result.saved_nik_id).toBeUndefined();
  });
});
