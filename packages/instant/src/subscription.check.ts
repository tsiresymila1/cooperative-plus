// Runnable self-check for the subscription lifecycle helpers.
//   pnpm --filter @cp/instant exec tsx src/subscription.check.ts
import assert from "node:assert";
import { dueStatus, nextPeriodEnd, atLimit, DAY_MS, GRACE_DAYS } from "./subscription";

const now = 1_700_000_000_000;

// trialing: not expired → no change; expired → past_due
assert.equal(dueStatus({ status: "trialing", trialEndsAt: now + DAY_MS }, now), null);
assert.equal(dueStatus({ status: "trialing", trialEndsAt: now - DAY_MS }, now), "past_due");

// active period still valid → null; expired within grace → past_due; beyond grace → suspended
assert.equal(dueStatus({ status: "active", currentPeriodEnd: now + DAY_MS }, now), null);
assert.equal(dueStatus({ status: "active", currentPeriodEnd: now - DAY_MS }, now), "past_due");
assert.equal(dueStatus({ status: "past_due", currentPeriodEnd: now - DAY_MS }, now), null);
assert.equal(dueStatus({ status: "past_due", currentPeriodEnd: now - (GRACE_DAYS + 1) * DAY_MS }, now), "suspended");

// a renewed payment while past_due → back to active
assert.equal(dueStatus({ status: "past_due", currentPeriodEnd: now + DAY_MS }, now), "active");

// terminal states never transition
assert.equal(dueStatus({ status: "suspended", currentPeriodEnd: now - 999 * DAY_MS }, now), null);
assert.equal(dueStatus({ status: "cancelled" }, now), null);

// nextPeriodEnd: extends from the current end when in the future, else from now
const monthMs = new Date(new Date(now).setMonth(new Date(now).getMonth() + 1)).getTime();
assert.equal(nextPeriodEnd(null, now), monthMs);
assert.ok(nextPeriodEnd(now + 10 * DAY_MS, now) > monthMs); // future end → stacks on top

// atLimit: 0/undefined = unlimited
assert.equal(atLimit(3, 3), true);
assert.equal(atLimit(3, 2), false);
assert.equal(atLimit(0, 999), false);
assert.equal(atLimit(undefined, 999), false);

console.log("subscription helpers OK");
