import test from "node:test";
import assert from "node:assert/strict";
import {
  schedule,
  conflicts,
  validate,
  example,
  dateTime,
} from "../src/core.js";
test("resting time ends at target and cooking starts at the exact backwards offset", () => {
  const meal = example().meals[0],
    rows = schedule(meal),
    roast = rows.find((r) => r.id === "roast");
  assert.equal(roast.finish, dateTime(meal.target));
  assert.equal(roast.start, roast.finish - 50 * 60000);
  assert.equal(roast.cookingEnds, roast.finish - 5 * 60000);
  assert.equal(new Date(roast.start).getHours(), 17);
  assert.equal(new Date(roast.start).getMinutes(), 40);
});
test("overlapping oven temperatures conflict, same-temperature sharing does not", () => {
  const meal = example().meals[0];
  assert.equal(conflicts(schedule(meal)).length, 1);
  meal.tasks[1].temp = 200;
  assert.equal(conflicts(schedule(meal)).length, 0);
  meal.tasks[1].resource = "Other oven";
  meal.tasks[1].temp = 180;
  assert.equal(conflicts(schedule(meal)).length, 0);
});
test("resting does not reserve a resource and touching cooking intervals are allowed", () => {
  const end = dateTime("2026-10-25T18:30");
  const rows = [
    {
      name: "A",
      start: end - 30 * 60000,
      cookingEnds: end - 20 * 60000,
      resourceType: "exclusive",
      resource: "Hob",
      temp: null,
    },
    {
      name: "B",
      start: end - 20 * 60000,
      cookingEnds: end,
      resourceType: "exclusive",
      resource: "Hob",
      temp: null,
    },
  ];
  assert.equal(conflicts(rows).length, 0);
  rows[1].start--;
  assert.equal(conflicts(rows).length, 1);
});
test("calendar rollover and invalid durations fail before save", () => {
  assert.throws(() => dateTime("2026-02-30T18:30"));
  assert.throws(() => dateTime("1999-01-01T00:00"));
  const data = example();
  data.meals[0].tasks[0].cook = true;
  assert.throws(() => validate(data));
  data.meals[0].tasks[0].cook = 0;
  assert.throws(() => validate(data));
});
test("duplicate identifiers, unknown fields and malformed timers fail", () => {
  const data = example();
  data.meals.push(structuredClone(data.meals[0]));
  assert.throws(() => validate(data));
  assert.throws(() => validate({ ...example(), unexpected: true }));
  const other = example();
  other.timers = [{ id: "bad", label: "Timer", endsAt: Infinity }];
  assert.throws(() => validate(other));
});
