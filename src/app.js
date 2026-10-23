import { schedule, conflicts, validate } from "./core.js";
import {
  $,
  el,
  button,
  field,
  message,
  uid,
  clone,
  vault,
  save,
  setup,
  markDirty,
  leaveDraft,
  dirty,
} from "./ui.js";
let selected = null,
  draft = null,
  taskInputs = [],
  nameInput,
  targetInput,
  lastDelete = null;
const format = (ms) =>
  new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "shortOffset",
  });
function capture() {
  if (!draft) return;
  draft.name = nameInput.value;
  draft.target = targetInput.value;
  draft.tasks = taskInputs.map(({ task, inputs }) => ({
    ...task,
    name: inputs.name.value,
    cook: Number(inputs.cook.value),
    rest: Number(inputs.rest.value),
    resourceType: inputs.resourceType.value,
    resource: inputs.resource.value,
    temp:
      inputs.resourceType.value === "oven" ? Number(inputs.temp.value) : null,
  }));
}
function refresh() {
  const data = vault.data;
  if (!data.meals.some((m) => m.id === selected))
    selected = data.meals[0]?.id || null;
  draft = clone(data.meals.find((m) => m.id === selected) || null);
  renderNav();
  renderEditor();
  renderSaved();
  renderTimers();
}
function renderNav() {
  const records = $("records");
  records.replaceChildren();
  for (const meal of vault.data.meals) {
    const b = button(
      meal.name,
      () => {
        if (!leaveDraft()) return;
        selected = meal.id;
        markDirty(false);
        refresh();
      },
      meal.id === selected ? "selected secondary" : "secondary",
    );
    b.append(
      el(
        "small",
        `${meal.tasks.length} dishes · ${format(new Date(meal.target).getTime())}`,
      ),
    );
    records.append(b);
  }
  if (!vault.data.meals.length)
    records.append(
      el("p", "No saved meals yet. Start a meal or try the example.", "hint"),
    );
}
function newMeal() {
  if (!leaveDraft()) return;
  const d = new Date();
  d.setMinutes(d.getMinutes() + 120 - d.getTimezoneOffset());
  draft = {
    id: uid(),
    name: "",
    target: d.toISOString().slice(0, 16),
    tasks: [],
  };
  selected = null;
  markDirty(true);
  renderNav();
  renderEditor();
  renderSaved();
  $("meal-name").focus();
}
function renderEditor() {
  const host = $("editor");
  host.replaceChildren();
  if (!draft) {
    host.append(
      el("div", "Create a meal to work backwards from serving time.", "empty"),
    );
    return;
  }
  const title = el("div", undefined, "section-title");
  title.append(el("h2", selected ? "Edit meal" : "New meal"));
  host.append(title);
  const form = el("form");
  const row = el("div", undefined, "fields");
  const n = field("Meal name", { value: draft.name, max: 120, required: true });
  n.input.id = "meal-name";
  nameInput = n.input;
  const t = field("Serve at (this device’s local time)", {
    value: draft.target,
    type: "datetime-local",
    required: true,
  });
  targetInput = t.input;
  row.append(n.wrap, t.wrap);
  form.append(
    row,
    el(
      "p",
      "Enter your own cooking and resting durations. Start times assume no preheating or preparation time unless you add it as a separate dish.",
      "hint",
    ),
  );
  taskInputs = [];
  const rows = el("div");
  draft.tasks.forEach((task, index) => {
    const section = el("fieldset", undefined, "entry");
    const legend = el("legend", `Dish ${index + 1}`);
    section.append(legend);
    const grid = el("div", undefined, "fields");
    const fields = {
      name: field("Dish name", { value: task.name, max: 120, required: true }),
      cook: field("Cooking minutes", {
        value: task.cook,
        type: "number",
        min: 1,
        step: 1,
        required: true,
      }),
      rest: field("Resting minutes", {
        value: task.rest,
        type: "number",
        min: 0,
        step: 1,
        required: true,
      }),
      resourceType: field("Resource use", {
        value: task.resourceType,
        options: [
          ["none", "No shared resource"],
          ["oven", "Shared oven"],
          ["exclusive", "Exclusive resource"],
        ],
      }),
      resource: field("Resource name", { value: task.resource, max: 80 }),
      temp: field("Oven temperature (°C)", {
        value: task.temp ?? 180,
        type: "number",
        min: 30,
        step: 1,
      }),
    };
    const update = () => {
      fields.resource.input.required =
        fields.resourceType.input.value !== "none";
      fields.temp.input.disabled = fields.resourceType.input.value !== "oven";
      fields.temp.input.required = fields.resourceType.input.value === "oven";
    };
    update();
    fields.resourceType.input.addEventListener("change", update);
    for (const f of Object.values(fields)) grid.append(f.wrap);
    section.append(
      grid,
      button(
        "Remove dish",
        () => {
          capture();
          if (
            !confirm(
              `Remove ${draft.tasks[index].name || "this dish"} from the draft?`,
            )
          )
            return;
          draft.tasks.splice(index, 1);
          markDirty();
          renderEditor();
        },
        "danger",
      ),
    );
    rows.append(section);
    taskInputs.push({
      task,
      inputs: Object.fromEntries(
        Object.entries(fields).map(([k, f]) => [k, f.input]),
      ),
    });
  });
  form.append(rows);
  const actions = el("div", undefined, "actions");
  actions.append(
    button("Add dish", () => {
      capture();
      if (draft.tasks.length >= 60)
        throw new Error("One meal supports up to 60 dishes.");
      draft.tasks.push({
        id: uid(),
        name: "",
        cook: 20,
        rest: 0,
        resourceType: "none",
        resource: "",
        temp: null,
      });
      markDirty();
      renderEditor();
      const fields = taskInputs.at(-1);
      fields.inputs.name.focus();
    }),
  );
  const submit = el("button", "Save meal");
  submit.type = "submit";
  actions.append(
    submit,
    button("Discard draft changes", () => {
      if (!leaveDraft()) return;
      markDirty(false);
      refresh();
    }),
  );
  if (selected)
    actions.append(
      button(
        "Delete meal",
        () => {
          if (
            !confirm(
              "Delete this saved meal? You can undo this deletion until another save, restore or reload.",
            )
          )
            return;
          const before = vault.data,
            next = vault.data;
          next.meals = next.meals.filter((m) => m.id !== selected);
          save(next);
          lastDelete = { data: before, basis: vault.raw };
          selected = null;
          refresh();
          $("undo").hidden = false;
        },
        "danger",
      ),
    );
  form.append(actions);
  form.addEventListener("input", () => markDirty());
  form.onsubmit = (e) => {
    e.preventDefault();
    try {
      capture();
      const next = vault.data;
      const at = next.meals.findIndex((m) => m.id === draft.id);
      if (at < 0) next.meals.push(clone(draft));
      else next.meals[at] = clone(draft);
      validate(next);
      save(next);
      selected = draft.id;
      refresh();
    } catch (error) {
      message(error.message, true);
    }
  };
  host.append(form);
}
function renderSaved() {
  const host = $("preview"),
    print = $("print-sheet");
  host.replaceChildren();
  print.replaceChildren(el("h1", "Dinner finish-together schedule"));
  const meal = vault.data.meals.find((m) => m.id === selected);
  if (!meal) {
    print.append(el("p", "No meal selected."));
    return;
  }
  const title = el("h2", meal.name);
  host.append(
    title,
    el(
      "p",
      `Serve at ${format(new Date(meal.target).getTime())}. Schedule below uses the saved meal.`,
      "hint",
    ),
  );
  print.append(
    el("h2", meal.name),
    el(
      "p",
      `Target: ${format(new Date(meal.target).getTime())}. Times use this device’s local timezone.`,
    ),
  );
  const rows = schedule(meal),
    warnings = conflicts(rows);
  for (const warning of warnings) {
    const text = `${warning.a} and ${warning.b}: ${warning.reason} in ${warning.resource}. Adjust timings or resources before cooking.`;
    host.append(el("p", text, "notice error"));
    print.append(el("p", text));
  }
  if (!rows.length)
    host.append(el("p", "Add dishes and save to see a schedule.", "hint"));
  else if (!warnings.length)
    host.append(
      el(
        "p",
        "No conflicting resource times found. Oven capacity, preheating and preparation are yours to check.",
        "hint",
      ),
    );
  const list = el("ol", undefined, "schedule");
  for (const row of rows) {
    const li = el("li");
    li.append(el("time", format(row.start)));
    const body = el("div");
    body.append(
      el("strong", row.name),
      el(
        "div",
        `${row.cook} min cooking${row.rest ? ` + ${row.rest} min resting` : ""}. Finish cooking ${format(row.cookingEnds)}.`,
        "sub",
      ),
    );
    if (row.resourceType !== "none")
      body.append(
        el(
          "div",
          `${row.resource}${row.resourceType === "oven" ? ` · ${row.temp} °C` : ""}`,
          "sub",
        ),
      );
    body.append(
      button(`Start ${row.cook} min timer`, () =>
        startTimer(row.name, row.cook),
      ),
    );
    if (row.rest)
      body.append(
        button(`Start ${row.rest} min rest timer`, () =>
          startTimer(`${row.name} · rest`, row.rest),
        ),
      );
    li.append(body);
    list.append(li);
  }
  host.append(list);
  const printed = list.cloneNode(true);
  printed.querySelectorAll("button").forEach((b) => b.remove());
  print.append(
    printed,
    el(
      "p",
      "User-supplied durations only. No food-safety guidance is provided. Oven capacity, preparation, preheating and temperature-change time are not calculated.",
    ),
  );
}
function startTimer(label, minutes) {
  if (dirty)
    throw new Error("Save or discard editor changes before starting a timer.");
  const next = vault.data;
  next.timers.push({ id: uid(), label, endsAt: Date.now() + minutes * 60000 });
  save(next);
  renderTimers();
}
function renderTimers() {
  const host = $("timers");
  host.replaceChildren();
  for (const timer of vault.data.timers) {
    const row = el("div", undefined, "timer");
    const remaining = Math.max(
      0,
      Math.ceil((timer.endsAt - Date.now()) / 1000),
    );
    row.dataset.end = String(timer.endsAt);
    row.append(el("span", timer.label));
    const clock = el("strong", undefined, "clock");
    clock.setAttribute("role", "timer");
    row.append(
      clock,
      button("Dismiss timer", () => {
        if (dirty)
          throw new Error(
            "Save or discard editor changes before dismissing timers.",
          );
        const next = vault.data;
        next.timers = next.timers.filter((t) => t.id !== timer.id);
        save(next);
        renderTimers();
      }),
    );
    if (!remaining) row.classList.add("done");
    host.append(row);
  }
  tick();
}
function tick() {
  document.querySelectorAll(".timer").forEach((row) => {
    const seconds = Math.max(
      0,
      Math.ceil((Number(row.dataset.end) - Date.now()) / 1000),
    );
    row.querySelector(".clock").textContent = seconds
      ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} remaining`
      : "Time is up";
    row.classList.toggle("done", seconds === 0);
  });
}
$("new").onclick = newMeal;
$("undo").onclick = () => {
  try {
    if (!lastDelete) return;
    if (!leaveDraft()) return;
    if (vault.raw !== lastDelete.basis) {
      lastDelete = null;
      $("undo").hidden = true;
      throw new Error(
        "Undo is no longer available after another save or restore. Your newer saved data has been kept.",
      );
    }
    save(lastDelete.data);
    lastDelete = null;
    $("undo").hidden = true;
    refresh();
  } catch (e) {
    message(e.message, true);
  }
};
setup(refresh, (data) =>
  data.meals.length || data.timers.length
    ? `${data.meals.length} meal records and ${data.timers.length} timers`
    : "0 records",
);
setInterval(tick, 1000);
addEventListener("visibilitychange", tick);
