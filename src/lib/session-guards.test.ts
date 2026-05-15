import { describe, it, expect } from "vitest";
import { hasAdminRole, hasUserRole, isAuthenticated } from "./session-guards";

describe("session-guards", () => {
  it("hasAdminRole hanya menerima role ADMIN", () => {
    expect(hasAdminRole("ADMIN")).toBe(true);
    expect(hasAdminRole("USER")).toBe(false);
    expect(hasAdminRole(undefined)).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
  });

  it("hasUserRole hanya menerima role USER", () => {
    expect(hasUserRole("USER")).toBe(true);
    expect(hasUserRole("ADMIN")).toBe(false);
    expect(hasUserRole(undefined)).toBe(false);
    expect(hasUserRole(null)).toBe(false);
  });

  it("isAuthenticated menerima ADMIN dan USER", () => {
    expect(isAuthenticated("ADMIN")).toBe(true);
    expect(isAuthenticated("USER")).toBe(true);
    expect(isAuthenticated("GUEST")).toBe(false);
    expect(isAuthenticated(undefined)).toBe(false);
    expect(isAuthenticated(null)).toBe(false);
  });
});
