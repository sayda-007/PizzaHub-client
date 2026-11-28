import assert from "node:assert/strict";
import { test } from "node:test";

import { ORDER_STATUSES, orderTimeline, timelineState } from "./status.js";

test("a rejected order ends with a rejection, not a completed decision", () => {
  const steps = orderTimeline(ORDER_STATUSES.REJECTED);

  assert.equal(steps.at(-1).label, "Rejected");
  assert.equal(timelineState(ORDER_STATUSES.REJECTED, 0), "complete");
  assert.equal(timelineState(ORDER_STATUSES.REJECTED, 1), "complete");
  assert.equal(timelineState(ORDER_STATUSES.REJECTED, 2), "rejected");
});

test("accepted and cancelled orders keep their distinct timelines", () => {
  assert.deepEqual(
    [0, 1, 2].map((index) => timelineState(ORDER_STATUSES.ACCEPTED, index)),
    ["complete", "complete", "complete"],
  );
  assert.equal(orderTimeline(ORDER_STATUSES.CANCELLED).at(-1).label, "Cancelled");
  assert.deepEqual(
    [0, 1, 2].map((index) => timelineState(ORDER_STATUSES.CANCELLED, index)),
    ["complete", "cancelled", "cancelled"],
  );
});
