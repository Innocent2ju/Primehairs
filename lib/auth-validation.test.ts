import { describe, expect, it } from "vitest";
import {
  GENERIC_AUTH_ERROR,
  getAuthErrorMessage,
  hasErrors,
  validateSignIn,
  validateSignUp,
} from "./auth-validation";

const validSignUp = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

describe("validateSignIn", () => {
  it("accepts a valid email and password", () => {
    expect(validateSignIn({ email: "ada@example.com", password: "x" })).toEqual({});
  });

  it("requires both fields", () => {
    const errors = validateSignIn({ email: " ", password: "" });
    expect(errors.email).toBe("Enter your email address.");
    expect(errors.password).toBe("Enter your password.");
  });

  it.each(["ada", "ada@", "ada@example", "a da@example.com"])("rejects email %s", (email) => {
    expect(validateSignIn({ email, password: "x" }).email).toBe("Enter a valid email address.");
  });
});

describe("validateSignUp", () => {
  it("accepts valid values", () => {
    expect(validateSignUp(validSignUp)).toEqual({});
  });

  it("requires a non-blank name", () => {
    expect(validateSignUp({ ...validSignUp, name: "   " }).name).toBe("Enter your name.");
  });

  it("rejects short passwords", () => {
    const errors = validateSignUp({ ...validSignUp, password: "short", confirmPassword: "short" });
    expect(errors.password).toMatch(/at least 8/);
  });

  it("rejects overly long passwords", () => {
    const password = "a".repeat(129);
    expect(validateSignUp({ ...validSignUp, password, confirmPassword: password }).password).toMatch(
      /128 characters or fewer/
    );
  });

  it("requires matching confirmation", () => {
    expect(validateSignUp({ ...validSignUp, confirmPassword: "different" }).confirmPassword).toBe(
      "Passwords do not match."
    );
  });
});

describe("hasErrors", () => {
  it("detects whether any field has an error", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ email: "Required" })).toBe(true);
  });
});

describe("getAuthErrorMessage", () => {
  it("maps known error codes to friendly messages", () => {
    expect(getAuthErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD", message: "raw" })).toBe(
      "Incorrect email or password."
    );
  });

  it("explains rate limiting", () => {
    expect(getAuthErrorMessage({ status: 429 })).toMatch(/Too many attempts/);
  });

  it("falls back to the server message, then a generic one", () => {
    expect(getAuthErrorMessage({ code: "OTHER", message: "Server says no" })).toBe("Server says no");
    expect(getAuthErrorMessage({})).toBe(GENERIC_AUTH_ERROR);
  });
});
