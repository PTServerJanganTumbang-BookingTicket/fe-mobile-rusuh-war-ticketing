/**
 * Booking Fixtures Tests
 *
 * GH-12 T5: Unit tests for deterministic fixtures.
 */

import {
  CATEGORIES,
  CATEGORY_VIP,
  CATEGORY_FESTIVAL,
  CATEGORY_TRIBUNE,
  NIK_DIRECTORY,
  lookupNik,
  SAVED_NIKS,
  NIK_VALID_1,
  NIK_NOT_FOUND,
  NIK_INACTIVE,
  NIK_ALREADY_USED,
  EVENT_FIXTURE,
} from "@/features/booking/data/fixtures";

describe("Booking Fixtures", () => {
  describe("CATEGORIES", () => {
    it("has VIP (Rp 1.5M)", () => {
      expect(CATEGORY_VIP.name).toBe("VIP");
      expect(CATEGORY_VIP.price).toBe(1500000);
    });

    it("has Festival (Rp 850k)", () => {
      expect(CATEGORY_FESTIVAL.name).toBe("Festival");
      expect(CATEGORY_FESTIVAL.price).toBe(850000);
    });

    it("has Tribune (Rp 500k)", () => {
      expect(CATEGORY_TRIBUNE.name).toBe("Tribune");
      expect(CATEGORY_TRIBUNE.price).toBe(500000);
    });

    it("has 3 categories by default", () => {
      expect(CATEGORIES).toHaveLength(3);
      expect(CATEGORIES).toContain(CATEGORY_VIP);
      expect(CATEGORIES).toContain(CATEGORY_FESTIVAL);
      expect(CATEGORIES).toContain(CATEGORY_TRIBUNE);
    });

    it("all categories have maxPerOrder 3", () => {
      for (const cat of CATEGORIES) {
        expect(cat.maxPerOrder).toBe(3);
      }
    });
  });

  describe("NIK_DIRECTORY", () => {
    it("contains valid and invalid test NIKs", () => {
      expect(NIK_DIRECTORY[NIK_VALID_1].valid).toBe(true);
      expect(NIK_DIRECTORY[NIK_NOT_FOUND].valid).toBe(false);
      expect(NIK_DIRECTORY[NIK_INACTIVE].valid).toBe(false);
      expect(NIK_DIRECTORY[NIK_ALREADY_USED].valid).toBe(false);
    });

    it("valid NIKs have holder names", () => {
      expect(NIK_DIRECTORY[NIK_VALID_1].holderName).toBeDefined();
    });

    it("invalid NIKs have reasons", () => {
      expect(NIK_DIRECTORY[NIK_NOT_FOUND].reason).toBe("NIK_NOT_FOUND");
      expect(NIK_DIRECTORY[NIK_INACTIVE].reason).toBe("NIK_INACTIVE");
      expect(NIK_DIRECTORY[NIK_ALREADY_USED].reason).toBe("NIK_ALREADY_USED");
    });
  });

  describe("lookupNik", () => {
    it("returns valid=true for valid NIK", () => {
      const result = lookupNik(NIK_VALID_1);

      expect(result.valid).toBe(true);
      expect(result.nik).toBe(NIK_VALID_1);
      expect(result.reason).toBeUndefined();
    });

    it("returns valid=false with NIK_NOT_FOUND for unknown NIK", () => {
      const result = lookupNik("9876543210123456");

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("NIK_NOT_FOUND");
    });

    it("returns NIK_NOT_FOUND reason for not found fixture", () => {
      const result = lookupNik(NIK_NOT_FOUND);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("NIK_NOT_FOUND");
    });

    it("returns NIK_INACTIVE reason for inactive fixture", () => {
      const result = lookupNik(NIK_INACTIVE);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("NIK_INACTIVE");
    });

    it("returns NIK_ALREADY_USED with alreadyUsed flag", () => {
      const result = lookupNik(NIK_ALREADY_USED);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("NIK_ALREADY_USED");
      expect(result.alreadyUsed).toBe(true);
    });
  });

  describe("SAVED_NIKS", () => {
    it("has test aliases", () => {
      expect(SAVED_NIKS).toHaveLength(2);
    });

    it("each saved NIK has id, nikMasked, and label", () => {
      for (const savedNik of SAVED_NIKS) {
        expect(savedNik.id).toBeDefined();
        expect(savedNik.nikMasked).toBeDefined();
        expect(savedNik.label).toBeDefined();
      }
    });

    it("saved NIKs have meaningful labels", () => {
      const labels = SAVED_NIKS.map((sn) => sn.label);
      expect(labels).toContain("Adik");
      expect(labels).toContain("Kakak");
    });
  });

  describe("EVENT_FIXTURE", () => {
    it("has required event fields", () => {
      expect(EVENT_FIXTURE.id).toBeDefined();
      expect(EVENT_FIXTURE.name).toBeDefined();
      expect(EVENT_FIXTURE.date).toBeDefined();
      expect(EVENT_FIXTURE.venue).toBeDefined();
      expect(EVENT_FIXTURE.imageUrl).toBeDefined();
    });

    it("uses test event ID", () => {
      expect(EVENT_FIXTURE.id).toBe("evt_jkt_istora_nightfall");
    });
  });
});
