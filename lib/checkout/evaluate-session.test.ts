import { describe, expect, it } from "vitest";
import { evaluateSession, type ExpectedPayment } from "./evaluate-session";

const expected: ExpectedPayment = {
  orderId: "8a6e0804-2bd0-4672-b79d-d97027f9071a",
  totalCents: 18999,
  currency: "usd",
};

const paidSession = {
  payment_status: "paid" as const,
  amount_total: 18999,
  currency: "usd",
  client_reference_id: expected.orderId,
};

describe("evaluateSession", () => {
  it("accepts a paid session that matches the order", () => {
    expect(evaluateSession(paidSession, expected)).toBe("paid");
  });

  it.each(["unpaid", "no_payment_required"] as const)(
    "waits when payment_status is %s",
    (payment_status) => {
      expect(evaluateSession({ ...paidSession, payment_status }, expected)).toBe("awaiting_payment");
    }
  );

  it.each([
    ["a different amount", { amount_total: 1 }],
    ["a missing amount", { amount_total: null }],
    ["a different currency", { currency: "eur" }],
    ["a different order", { client_reference_id: "another-order" }],
  ])("flags %s for review", (_label, override) => {
    expect(evaluateSession({ ...paidSession, ...override }, expected)).toBe("needs_review");
  });
});
