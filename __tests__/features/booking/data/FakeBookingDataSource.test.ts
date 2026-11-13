/**
 * FakeBookingDataSource Tests
 *
 * GH-12 T6: Integration tests for FakeBookingDataSource.
 */

import { FakeBookingDataSource } from "@/features/booking/data/FakeBookingDataSource";
import {
  EVENT_FIXTURE,
  NIK_VALID_1,
  NIK_NOT_FOUND,
  NIK_INACTIVE,
  NIK_ALREADY_USED,
  SAVED_NIKS,
} from "@/features/booking/data/fixtures";
import type { BookingRequest } from "@/features/booking/domain";

describe("FakeBookingDataSource", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getTicketPage", () => {
    it("returns categories and session", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);
      const response = await promise;

      expect(response.categories.length).toBeGreaterThan(0);
      expect(response.session).toBeDefined();
      expect(response.session.expiresAt).toBeDefined();
      expect(response.session.serverTime).toBeDefined();
    });

    it("returns event info", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);
      const response = await promise;

      expect(response.event.id).toBe(EVENT_FIXTURE.id);
      expect(response.event.name).toBe(EVENT_FIXTURE.name);
    });

    it("returns account for logged-in user", async () => {
      const dataSource = new FakeBookingDataSource({ isLoggedIn: true });

      const promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);
      const response = await promise;

      expect(response.account).not.toBeNull();
      expect(response.account?.email).toBeDefined();
    });

    it("returns null account for guest", async () => {
      const dataSource = new FakeBookingDataSource({ isLoggedIn: false });

      const promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);
      const response = await promise;

      expect(response.account).toBeNull();
    });

    it("returns rules with maxTicketsPerOrder=3", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);
      const response = await promise;

      expect(response.rules.maxTicketsPerOrder).toBe(3);
      expect(response.rules.oneNikPerTicket).toBe(true);
    });

    it("throws GRANT_TOKEN_INVALID for grant_invalid scenario", async () => {
      const dataSource = new FakeBookingDataSource({
        scenario: "grant_invalid",
      });

      const promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);

      await expect(promise).rejects.toEqual(
        expect.objectContaining({ code: "GRANT_TOKEN_INVALID" })
      );
    });

    it("throws BOOKING_EXPIRED for expired scenario", async () => {
      const dataSource = new FakeBookingDataSource({ scenario: "expired" });

      const promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);

      await expect(promise).rejects.toEqual(
        expect.objectContaining({ code: "BOOKING_EXPIRED" })
      );
    });

    it("returns soldout categories for soldout scenario", async () => {
      const dataSource = new FakeBookingDataSource({ scenario: "soldout" });

      const promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);
      const response = await promise;

      const soldoutCategory = response.categories.find(
        (c) => c.available === 0
      );
      expect(soldoutCategory).toBeDefined();
    });
  });

  describe("validateNik", () => {
    it("returns valid=true for valid NIK", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.validateNik(NIK_VALID_1);
      jest.advanceTimersByTime(150);
      const response = await promise;

      expect(response.valid).toBe(true);
      expect(response.nik).toBe(NIK_VALID_1);
    });

    it("returns NIK_NOT_FOUND for unknown NIK", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.validateNik(NIK_NOT_FOUND);
      jest.advanceTimersByTime(150);
      const response = await promise;

      expect(response.valid).toBe(false);
      expect(response.reason).toBe("NIK_NOT_FOUND");
    });

    it("returns NIK_INACTIVE for inactive NIK", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.validateNik(NIK_INACTIVE);
      jest.advanceTimersByTime(150);
      const response = await promise;

      expect(response.valid).toBe(false);
      expect(response.reason).toBe("NIK_INACTIVE");
    });

    it("returns NIK_ALREADY_USED for already used NIK", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.validateNik(NIK_ALREADY_USED);
      jest.advanceTimersByTime(150);
      const response = await promise;

      expect(response.valid).toBe(false);
      expect(response.reason).toBe("NIK_ALREADY_USED");
      expect(response.alreadyUsed).toBe(true);
    });
  });

  describe("getSavedNiks", () => {
    it("returns saved NIKs for logged-in user", async () => {
      const dataSource = new FakeBookingDataSource({ isLoggedIn: true });

      const promise = dataSource.getSavedNiks();
      jest.advanceTimersByTime(50);
      const result = await promise;

      expect(result).toEqual(SAVED_NIKS);
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns empty array for guest", async () => {
      const dataSource = new FakeBookingDataSource({ isLoggedIn: false });

      const promise = dataSource.getSavedNiks();
      jest.advanceTimersByTime(50);
      const result = await promise;

      expect(result).toEqual([]);
    });
  });

  describe("createBooking", () => {
    const validRequest: BookingRequest = {
      eventId: EVENT_FIXTURE.id,
      tickets: [{ categoryId: "cat_vip", nik: NIK_VALID_1 }],
      contactEmail: "user@example.com",
    };

    it("returns booking_id on success", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.createBooking(validRequest);
      jest.advanceTimersByTime(250);
      const response = await promise;

      expect(response.bookingId).toMatch(/^bkg_fake_/);
      expect(response.status).toBe("PENDING_PAYMENT");
    });

    it("returns summary with subtotal and serviceFee", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.createBooking(validRequest);
      jest.advanceTimersByTime(250);
      const response = await promise;

      expect(response.summary.subtotal).toBeGreaterThan(0);
      expect(response.summary.serviceFee).toBeGreaterThan(0);
      expect(response.summary.total).toBe(
        response.summary.subtotal + response.summary.serviceFee
      );
    });

    it("returns ticket details with holder info", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.createBooking(validRequest);
      jest.advanceTimersByTime(250);
      const response = await promise;

      expect(response.tickets).toHaveLength(1);
      expect(response.tickets[0].nikMasked).toBeDefined();
      expect(response.tickets[0].holderName).toBeDefined();
    });

    it("returns paymentTtl", async () => {
      const dataSource = new FakeBookingDataSource();

      const promise = dataSource.createBooking(validRequest);
      jest.advanceTimersByTime(250);
      const response = await promise;

      expect(response.paymentTtl.expiresAt).toBeDefined();
      expect(response.paymentTtl.ttlSeconds).toBe(600);
    });

    it("throws NIK_ALREADY_USED for nik_already_used scenario", async () => {
      const dataSource = new FakeBookingDataSource({
        scenario: "nik_already_used",
      });

      const promise = dataSource.createBooking(validRequest);
      jest.advanceTimersByTime(250);

      await expect(promise).rejects.toMatchObject({
        code: "NIK_ALREADY_USED",
        index: 0,
      });
    });

    it("throws INSUFFICIENT_STOCK for insufficient_stock scenario", async () => {
      const dataSource = new FakeBookingDataSource({
        scenario: "insufficient_stock",
      });

      const promise = dataSource.createBooking(validRequest);
      jest.advanceTimersByTime(250);

      await expect(promise).rejects.toEqual(
        expect.objectContaining({ code: "INSUFFICIENT_STOCK" })
      );
    });

    it("throws BOOKING_EXPIRED for expired scenario", async () => {
      const dataSource = new FakeBookingDataSource({ scenario: "expired" });

      const promise = dataSource.createBooking(validRequest);
      jest.advanceTimersByTime(250);

      await expect(promise).rejects.toEqual(
        expect.objectContaining({ code: "BOOKING_EXPIRED" })
      );
    });

    it("throws GRANT_TOKEN_INVALID for grant_invalid scenario", async () => {
      const dataSource = new FakeBookingDataSource({
        scenario: "grant_invalid",
      });

      const promise = dataSource.createBooking(validRequest);
      jest.advanceTimersByTime(250);

      await expect(promise).rejects.toEqual(
        expect.objectContaining({ code: "GRANT_TOKEN_INVALID" })
      );
    });

    it("validates NIK in request and throws error for invalid", async () => {
      const dataSource = new FakeBookingDataSource();
      const requestWithInvalidNik: BookingRequest = {
        eventId: EVENT_FIXTURE.id,
        tickets: [{ categoryId: "cat_vip", nik: NIK_ALREADY_USED }],
        contactEmail: "user@example.com",
      };

      const promise = dataSource.createBooking(requestWithInvalidNik);
      jest.advanceTimersByTime(250);

      await expect(promise).rejects.toMatchObject({
        code: "NIK_ALREADY_USED",
        index: 0,
      });
    });

    it("supports savedNikId in tickets", async () => {
      const dataSource = new FakeBookingDataSource();
      const request: BookingRequest = {
        eventId: EVENT_FIXTURE.id,
        tickets: [{ categoryId: "cat_vip", savedNikId: "snik_001" }],
        contactEmail: "user@example.com",
      };

      const promise = dataSource.createBooking(request);
      jest.advanceTimersByTime(250);
      const response = await promise;

      expect(response.tickets[0].holderName).toBeDefined();
    });

    it("supports useAccountNik in tickets", async () => {
      const dataSource = new FakeBookingDataSource();
      const request: BookingRequest = {
        eventId: EVENT_FIXTURE.id,
        tickets: [{ categoryId: "cat_festival", useAccountNik: true }],
        contactEmail: "user@example.com",
      };

      const promise = dataSource.createBooking(request);
      jest.advanceTimersByTime(250);
      const response = await promise;

      expect(response.tickets[0].holderName).toBeDefined();
    });

    it("handles multiple tickets", async () => {
      const dataSource = new FakeBookingDataSource();
      const request: BookingRequest = {
        eventId: EVENT_FIXTURE.id,
        tickets: [
          { categoryId: "cat_vip", nik: NIK_VALID_1 },
          { categoryId: "cat_vip", savedNikId: "snik_001" },
          { categoryId: "cat_festival", useAccountNik: true },
        ],
        contactEmail: "user@example.com",
      };

      const promise = dataSource.createBooking(request);
      jest.advanceTimersByTime(250);
      const response = await promise;

      expect(response.tickets).toHaveLength(3);
      expect(response.summary.subtotal).toBe(1500000 + 1500000 + 850000);
    });
  });

  describe("setScenario", () => {
    it("changes behavior for subsequent calls", async () => {
      const dataSource = new FakeBookingDataSource();

      // First call normal
      let promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);
      await promise;

      // Change to expired
      dataSource.setScenario("expired");

      // Second call should throw
      promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);

      await expect(promise).rejects.toEqual(
        expect.objectContaining({ code: "BOOKING_EXPIRED" })
      );
    });

    it("getScenario returns current scenario", () => {
      const dataSource = new FakeBookingDataSource({ scenario: "soldout" });

      expect(dataSource.getScenario()).toBe("soldout");

      dataSource.setScenario("normal");
      expect(dataSource.getScenario()).toBe("normal");
    });
  });

  describe("setLoggedIn", () => {
    it("changes account in response", async () => {
      const dataSource = new FakeBookingDataSource({ isLoggedIn: true });

      // First call logged in
      let promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);
      let response = await promise;
      expect(response.account).not.toBeNull();

      // Switch to guest
      dataSource.setLoggedIn(false);

      // Second call should be guest
      promise = dataSource.getTicketPage(EVENT_FIXTURE.id);
      jest.advanceTimersByTime(100);
      response = await promise;
      expect(response.account).toBeNull();
    });
  });
});
