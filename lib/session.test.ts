import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: getSessionMock } } }));

import { requireAdmin, requireUser } from "./session";

const sessionFor = (role: string) => ({
  session: { id: "s1" },
  user: { id: "u1", email: "user@example.com", name: "User", role },
});

beforeEach(() => getSessionMock.mockReset());

describe("requireUser", () => {
  it("redirects signed-out visitors to sign in", async () => {
    getSessionMock.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("returns the signed-in user", async () => {
    getSessionMock.mockResolvedValue(sessionFor("customer"));
    await expect(requireUser()).resolves.toMatchObject({ id: "u1" });
  });
});

describe("requireAdmin", () => {
  it("redirects signed-out visitors to sign in", async () => {
    getSessionMock.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("redirects customers home", async () => {
    getSessionMock.mockResolvedValue(sessionFor("customer"));
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/");
  });

  it("returns the admin user", async () => {
    getSessionMock.mockResolvedValue(sessionFor("admin"));
    await expect(requireAdmin()).resolves.toMatchObject({ role: "admin" });
  });
});
