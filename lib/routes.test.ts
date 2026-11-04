import { describe, expect, it } from "vitest";
import { getSafeRedirectPath, isProtectedPath, withRedirect } from "./routes";

describe("getSafeRedirectPath", () => {
  it("keeps same-site relative paths", () => {
    expect(getSafeRedirectPath("/products/wig?x=1")).toBe("/products/wig?x=1");
  });

  it.each([null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "products"])(
    "falls back to home for %s",
    (value) => {
      expect(getSafeRedirectPath(value)).toBe("/");
    }
  );
});

describe("isProtectedPath", () => {
  it.each([
    "/account",
    "/account/orders",
    "/admin",
    "/admin/products",
    "/checkout/success",
    "/checkout/cancel",
  ])("protects %s", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(["/", "/products", "/accounting", "/sign-in"])("does not protect %s", (path) => {
    expect(isProtectedPath(path)).toBe(false);
  });
});

describe("withRedirect", () => {
  it("encodes the return path", () => {
    expect(withRedirect("/sign-in", "/products?a=1&b=2")).toBe(
      "/sign-in?redirectTo=%2Fproducts%3Fa%3D1%26b%3D2"
    );
  });
});
