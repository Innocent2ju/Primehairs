import { describe, expect, it } from "vitest";
import { formatMemberSince, getInitials } from "./account";

describe("getInitials", () => {
  it.each([
    ["Ada", "A"],
    ["ada lovelace", "AL"],
    ["  Ada   King  Lovelace ", "AL"],
    ["", "?"],
    ["   ", "?"],
  ])("returns initials for %j", (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });
});

describe("formatMemberSince", () => {
  it("formats dates as month and year", () => {
    expect(formatMemberSince(new Date("2025-03-15T12:00:00Z"))).toBe("March 2025");
  });

  it("accepts ISO strings", () => {
    expect(formatMemberSince("2024-12-31T23:30:00Z")).toBe("December 2024");
  });
});
