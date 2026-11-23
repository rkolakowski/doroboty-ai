import { expect, it } from "vitest";
import { initialState, transition, type State } from "./model";

function as(state: State, id: string) {
  return transition(state, { type: "select_person", id });
}

it("loads the Build applications and lets only their employer update the test deadline", () => {
  const state = initialState();
  const action = {
    type: "next_step_due",
    applicationId: "app-029542",
    due: "2026-11-26",
  } as const;
  expect(state.applications.find((app) => app.id === action.applicationId)?.nextStepDue).toBe(
    "2026-11-24",
  );
  expect(() => transition(as(state, "cand-008793"), action)).toThrow("Wybierz profil pracodawcy");
  expect(() => transition(as(state, "employer-brightlabs"), action)).toThrow(
    "Nie można zmienić terminu",
  );
  const updated = transition(as(state, "employer-splot"), action);
  const invited = transition(
    updated,
    { type: "stage", applicationId: action.applicationId, stage: "interview_invited", note: "" },
    "2026-11-23T12:00:00.000Z",
  );
  expect(updated.applications.find((app) => app.id === action.applicationId)?.nextStepDue).toBe(
    action.due,
  );
  expect(
    invited.applications.find((app) => app.id === action.applicationId)?.nextStepDue,
  ).toBeUndefined();
});
