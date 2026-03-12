import assert from "node:assert/strict";
import test from "node:test";

test("hasAdminRole hanya menerima role ADMIN", async () => {
  const loadedModule = await import("./session-guards").catch(() => null);

  assert.ok(loadedModule, "Module session-guards.ts harus tersedia.");
  assert.equal(loadedModule.hasAdminRole("ADMIN"), true);
  assert.equal(loadedModule.hasAdminRole("USER"), false);
  assert.equal(loadedModule.hasAdminRole(undefined), false);
  assert.equal(loadedModule.hasAdminRole(null), false);
});
