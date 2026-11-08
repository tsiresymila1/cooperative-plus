import { beforeEach, expect, it, vi } from "vitest";
const verifyToken = vi.hoisted(() => vi.fn());
vi.mock("@cp/instant/admin", () => ({ adminDb: { auth: { verifyToken } } }));
import { requireUser } from "./session";
beforeEach(() => vi.resetAllMocks());
it.each([undefined, "", "Basic token", "Bearer token extra"])("rejects invalid authorization %s", async header => {
  await expect(requireUser(header)).rejects.toMatchObject({ status: 401 });
  expect(verifyToken).not.toHaveBeenCalled();
});
it("rejects an expired session", async () => {
  verifyToken.mockRejectedValue(new Error("expired"));
  await expect(requireUser("Bearer token")).rejects.toMatchObject({ status: 401 });
});
it("returns only the verified user id", async () => {
  verifyToken.mockResolvedValue({ id: "verified-user" });
  await expect(requireUser("Bearer token")).resolves.toBe("verified-user");
});
