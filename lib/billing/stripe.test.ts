import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  eventCustomer,
  form,
  planFromSubscriptions,
  signWebhook,
  subscriptionRow,
  verifyWebhook,
  WEBHOOK_TOLERANCE,
} from "./stripe.ts";

const SECRET = "whsec_test_creditdash";
const NOW = 1_793_000_000;
const BODY = JSON.stringify({ id: "evt_1", type: "customer.subscription.updated" });

describe("verifyWebhook", () => {
  test("accepts a correctly signed, current payload", async () => {
    const header = await signWebhook(BODY, SECRET, NOW);
    assert.equal(await verifyWebhook(BODY, header, SECRET, NOW), true);
  });

  test("refuses a body changed after signing", async () => {
    const header = await signWebhook(BODY, SECRET, NOW);
    const tampered = BODY.replace("updated", "deleted");
    assert.equal(await verifyWebhook(tampered, header, SECRET, NOW), false);
  });

  test("refuses a re-serialised body, which is why the raw text is used", async () => {
    const pretty = JSON.stringify({ id: "evt_1", type: "x" }, null, 2);
    const header = await signWebhook(JSON.stringify({ id: "evt_1", type: "x" }), SECRET, NOW);
    assert.equal(await verifyWebhook(pretty, header, SECRET, NOW), false);
  });

  test("refuses the wrong secret", async () => {
    const header = await signWebhook(BODY, "whsec_someone_else", NOW);
    assert.equal(await verifyWebhook(BODY, header, SECRET, NOW), false);
  });

  test("refuses a replay older than the tolerance, in either direction", async () => {
    const old = await signWebhook(BODY, SECRET, NOW - WEBHOOK_TOLERANCE - 1);
    assert.equal(await verifyWebhook(BODY, old, SECRET, NOW), false);
    const future = await signWebhook(BODY, SECRET, NOW + WEBHOOK_TOLERANCE + 1);
    assert.equal(await verifyWebhook(BODY, future, SECRET, NOW), false);
    const edge = await signWebhook(BODY, SECRET, NOW - WEBHOOK_TOLERANCE);
    assert.equal(await verifyWebhook(BODY, edge, SECRET, NOW), true);
  });

  test("accepts any one of several v1 signatures, as during a secret roll", async () => {
    const good = await signWebhook(BODY, SECRET, NOW);
    const v1 = good.split("v1=")[1];
    const header = `t=${NOW},v1=${"0".repeat(64)},v1=${v1},v0=ignored`;
    assert.equal(await verifyWebhook(BODY, header, SECRET, NOW), true);
  });

  test("refuses missing or malformed headers", async () => {
    for (const header of [null, "", "t=abc,v1=00", `t=${NOW}`, "v1=00", "nonsense"]) {
      assert.equal(await verifyWebhook(BODY, header, SECRET, NOW), false, String(header));
    }
    const header = await signWebhook(BODY, SECRET, NOW);
    assert.equal(await verifyWebhook(BODY, header, "", NOW), false);
  });
});

describe("planFromSubscriptions", () => {
  test("no subscriptions is Free", () => {
    assert.equal(planFromSubscriptions([]), "free");
  });

  test("live statuses are Premium, including a payment being retried", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      assert.equal(planFromSubscriptions([{ status }]), "premium", status);
    }
  });

  test("ended or never-started statuses are Free", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
      assert.equal(planFromSubscriptions([{ status }]), "free", status);
    }
  });

  test("one live subscription among ended ones is Premium", () => {
    assert.equal(
      planFromSubscriptions([{ status: "canceled" }, { status: "active" }]),
      "premium",
    );
  });
});

describe("subscriptionRow", () => {
  test("reads the period end from the item, as newer API versions put it", () => {
    const row = subscriptionRow({
      id: "sub_1",
      status: "active",
      cancel_at_period_end: false,
      items: { data: [{ current_period_end: 1_793_000_000 }] },
    });
    assert.equal(row.current_period_end, new Date(1_793_000_000 * 1000).toISOString());
    assert.equal(row.cancel_at_period_end, false);
  });

  test("falls back to the subscription's own period end", () => {
    const row = subscriptionRow({ id: "sub_1", status: "active", current_period_end: 1_793_000_000 });
    assert.equal(row.current_period_end, new Date(1_793_000_000 * 1000).toISOString());
  });

  test("a scheduled cancel_at counts as cancelling", () => {
    const row = subscriptionRow({ id: "sub_1", status: "active", cancel_at: 1_793_000_000 });
    assert.equal(row.cancel_at_period_end, true);
  });

  test("no period end at all is null, not 1970", () => {
    assert.equal(subscriptionRow({ id: "sub_1", status: "incomplete" }).current_period_end, null);
  });
});

describe("form", () => {
  test("encodes bracketed keys and drops undefined", () => {
    assert.equal(
      form({ "line_items[0][price]": "price_1", "line_items[0][quantity]": 1, skip: undefined }),
      "line_items%5B0%5D%5Bprice%5D=price_1&line_items%5B0%5D%5Bquantity%5D=1",
    );
  });
});

describe("eventCustomer", () => {
  test("reads a customer id string or an expanded customer", () => {
    assert.equal(eventCustomer({ data: { object: { customer: "cus_1" } } }), "cus_1");
    assert.equal(eventCustomer({ data: { object: { customer: { id: "cus_2" } } } }), "cus_2");
    assert.equal(eventCustomer({ data: { object: {} } }), null);
    assert.equal(eventCustomer({}), null);
  });
});
