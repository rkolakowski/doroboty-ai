import { expect, it } from "vitest";
import { initialState, transition, type State } from "./model";
import { belongsToReview, contributionReview, contributionRoleId } from "./contribution-review";

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

it("keeps both review sets comparable and snapshots the question on a new submission", () => {
  const state = initialState();
  const role = state.jobs.find((job) => job.id === contributionRoleId)!;
  for (const set of ["a", "b"]) {
    const review = contributionReview(new URLSearchParams({ zestaw: set, material: "cv" }))!;
    const rows = state.applications.filter((row) => belongsToReview(row.id, review));
    expect(rows).toHaveLength(3);
    expect(
      rows.every(
        (row) => row.jobId === role.id && row.contributionQuestion === role.contributionQuestion,
      ),
    ).toBe(true);
  }
  const next = transition(as(state, "candidate-anna"), {
    type: "submit",
    jobId: role.id,
    notes: "",
    generated: "",
    answer: "I evaluated a model and paused the release after finding an error.",
    questionResponses: role.applicationQuestions?.map((question) => ({
      ...question,
      response: question.options?.[0] ?? "I paused the release after the evaluation.",
    })),
    consent: true,
  });
  expect(next.applications.at(-1)?.contributionQuestion).toBe(role.contributionQuestion);
});
it("requires current questions when submitting and retains the submitted version when the offer changes", () => {
  const state = initialState();
  const role = state.jobs.find((job) => job.id === contributionRoleId)!;
  const question = { kind: "screening", prompt: "Od kiedy możesz zacząć?" } as const;
  const configure = (base: State, prompt: string) =>
    transition(as(base, "employer-splot"), {
      type: "publish",
      job: { ...role, applicationQuestions: [{ ...question, prompt }] },
    });
  const configured = configure(state, question.prompt);
  const submit = {
    type: "submit",
    jobId: role.id,
    notes: "",
    generated: "",
    answer: "",
    consent: true,
    questionResponses: [{ ...question, response: "Od stycznia." }],
  } as const;
  const action = { ...submit, questionResponses: [...submit.questionResponses] };
  const revised = configure(configured, "Od kiedy jesteś dostępny?");
  expect(() => transition(as(revised, "candidate-anna"), action)).toThrow("aktualnej oferty");
  const accepted = transition(as(configured, "candidate-anna"), action);
  expect(
    configure(accepted, "Od kiedy jesteś dostępny?").applications.at(-1)?.questionResponses,
  ).toEqual(action.questionResponses);
});
