export const APP = "dinner-finish-together";
export function text(value, label, max = 4000, required = false) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new Error(
      `${label} must be ${required ? "nonempty text" : "text"} up to ${max} characters.`,
    );
  return value;
}
export function integer(value, label, min, max) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return value;
}
export function object(value, keys) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => !keys.includes(k))
  )
    throw new Error("Unexpected record structure.");
}
export function dateTime(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
  )
    throw new Error("Choose a valid meal date and time.");
  const d = new Date(value),
    pad = (n) => String(n).padStart(2, "0");
  const actual = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (
    !Number.isFinite(d.getTime()) ||
    actual !== value ||
    d.getFullYear() < 2000 ||
    d.getFullYear() > 2100
  )
    throw new Error(
      "Choose an existing local date and time from 2000 to 2100.",
    );
  return d.getTime();
}
export function unique(list) {
  if (new Set(list.map((v) => v.id)).size !== list.length)
    throw new Error("Duplicate record identifiers are not allowed.");
}
export function task(value) {
  object(value, [
    "id",
    "name",
    "cook",
    "rest",
    "resourceType",
    "resource",
    "temp",
  ]);
  text(value.id, "Identifier", 80, true);
  text(value.name, "Dish", 120, true);
  integer(value.cook, "Cooking duration", 1, 1440);
  integer(value.rest, "Rest duration", 0, 1440);
  if (!["none", "oven", "exclusive"].includes(value.resourceType))
    throw new Error("Choose a resource type.");
  text(value.resource, "Resource", 80, value.resourceType !== "none");
  if (value.resourceType === "oven")
    integer(value.temp, "Oven temperature (°C)", 30, 350);
  else if (value.temp !== null)
    throw new Error("Temperature belongs only to oven tasks.");
  return value;
}
export function validate(data) {
  object(data, ["meals", "timers"]);
  if (
    !Array.isArray(data.meals) ||
    data.meals.length > 300 ||
    !Array.isArray(data.timers) ||
    data.timers.length > 100
  )
    throw new Error("Backup exceeds the meal or timer limit.");
  for (const m of data.meals) {
    object(m, ["id", "name", "target", "tasks"]);
    text(m.id, "Identifier", 80, true);
    text(m.name, "Meal name", 120, true);
    dateTime(m.target);
    if (!Array.isArray(m.tasks) || m.tasks.length > 60)
      throw new Error("A meal may contain up to 60 dishes.");
    m.tasks.forEach(task);
    unique(m.tasks);
  }
  for (const t of data.timers) {
    object(t, ["id", "label", "endsAt"]);
    text(t.id, "Identifier", 80, true);
    text(t.label, "Timer label", 180, true);
    if (
      !Number.isSafeInteger(t.endsAt) ||
      t.endsAt < 0 ||
      t.endsAt > 5000000000000
    )
      throw new Error("Invalid timer timestamp.");
  }
  unique(data.meals);
  unique(data.timers);
  return data;
}
export function schedule(meal) {
  const end = dateTime(meal.target);
  return meal.tasks
    .map((t) => {
      task(t);
      return {
        ...t,
        start: end - (t.cook + t.rest) * 60000,
        cookingEnds: end - t.rest * 60000,
        finish: end,
      };
    })
    .sort((a, b) => a.start - b.start || a.name.localeCompare(b.name));
}
export function conflicts(rows) {
  const result = [];
  for (let i = 0; i < rows.length; i++)
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i],
        b = rows[j];
      if (
        a.resourceType === "none" ||
        b.resourceType === "none" ||
        a.resource.trim().toLowerCase() !== b.resource.trim().toLowerCase()
      )
        continue;
      if (a.start >= b.cookingEnds || b.start >= a.cookingEnds) continue;
      if (
        a.resourceType !== b.resourceType ||
        a.resourceType === "exclusive" ||
        a.temp !== b.temp
      )
        result.push({
          a: a.name,
          b: b.name,
          resource: a.resource,
          reason:
            a.resourceType === "oven" && b.resourceType === "oven"
              ? "different oven temperatures"
              : "overlapping use of a resource",
        });
    }
  return result;
}
export const empty = () => ({ meals: [], timers: [] });
export const example = () => ({
  meals: [
    {
      id: "example-meal",
      name: "Sunday dinner",
      target: "2026-10-25T18:30",
      tasks: [
        {
          id: "roast",
          name: "Roasted vegetables",
          cook: 45,
          rest: 5,
          resourceType: "oven",
          resource: "Main oven",
          temp: 200,
        },
        {
          id: "pie",
          name: "Vegetable pie",
          cook: 35,
          rest: 10,
          resourceType: "oven",
          resource: "Main oven",
          temp: 180,
        },
        {
          id: "peas",
          name: "Peas",
          cook: 8,
          rest: 0,
          resourceType: "exclusive",
          resource: "Small hob",
          temp: null,
        },
      ],
    },
  ],
  timers: [],
});
