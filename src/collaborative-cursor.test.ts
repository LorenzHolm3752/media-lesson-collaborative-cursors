import assert from "node:assert/strict";
import { routeCursorError, InfraiError } from "./collaborative-cursor.ts";

const rejected = routeCursorError(new InfraiError("SESSION_REJECTED", "Session rejected", 401));
assert.deepEqual(rejected, { status: 401, body: { error: "SESSION_REJECTED" } });
assert.equal(routeCursorError(new Error("network")).status, 502);
console.log("cursor access decisions map to caller-facing responses");
