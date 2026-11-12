/**
 * Register Response Mapper Tests
 *
 * GH-6 T4: Mapper unit tests
 * R4-AC7: DTO maps to domain Result<RegisterResult, AuthError>
 */

import { mapRegisterResponse } from "@/features/auth/data";
import { mockRegisterResponse, FAKE_USER_ID } from "../../__fixtures__";

describe("mapRegisterResponse", () => {
  it("maps register response to RegisterResult", () => {
    const result = mapRegisterResponse(mockRegisterResponse);

    expect(result.userId).toBe(FAKE_USER_ID);
  });

  it("handles 200 status code response", () => {
    const response = {
      meta: { code: 200 as const, message: "Already registered" },
      data: { user_id: "usr_existing" },
    };

    const result = mapRegisterResponse(response);

    expect(result.userId).toBe("usr_existing");
  });

  it("handles 201 status code response", () => {
    const result = mapRegisterResponse(mockRegisterResponse);

    expect(result.userId).toBe(FAKE_USER_ID);
  });
});
