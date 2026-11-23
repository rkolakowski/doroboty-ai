import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Application, Stage } from "./model";
import { usePrototype } from "./store";

const steps: Partial<Record<Stage, [string, string]>> = {
  submitted: ["Pracodawca przejrzy Twoją aplikację", "Przejrzyj aplikację"],
  reviewed: [
    "Pracodawca da Ci znać, czy zaprosi Cię na rozmowę",
    "Zdecyduj, czy zaprosić na rozmowę",
  ],
  interview_invited: ["Pracodawca ustali z Tobą szczegóły rozmowy", "Ustal szczegóły rozmowy"],
  first_conversation_held: [
    "Pracodawca da Ci znać, czy przejdziesz dalej",
    "Podejmij decyzję po rozmowie",
  ],
  continued: [
    "Pracodawca przekaże decyzję po kolejnym etapie",
    "Przekaż decyzję po kolejnym etapie",
  ],
};
const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("pl-PL", { timeZone: "UTC", ...options }).format(date);

export function NextStep({
  application,
  candidate,
}: {
  application: Pick<Application, "id" | "stage" | "nextStepDue">;
  candidate: boolean;
}) {
  const { run } = usePrototype();
  const heading = useId();
  const [due, setDue] = useState(application.nextStepDue ?? "");
  const [saved, setSaved] = useState(false);
  const step = steps[application.stage];
  if (!step) return null;
  const date = application.nextStepDue ? new Date(application.nextStepDue) : null;
  return (
    <section className="next-step" aria-labelledby={heading}>
      <div>
        <p className="next-step-label">Następny krok</p>
        <h2 id={heading}>{step[candidate ? 0 : 1]}</h2>
        <p>Odpowiada: pracodawca</p>
        <p>
          {date ? (
            <>
              Termin:{" "}
              <time dateTime={application.nextStepDue}>{format(date, { dateStyle: "long" })}</time>{" "}
              · termin testowy
            </>
          ) : (
            "Pracodawca nie ustalił jeszcze terminu."
          )}
        </p>
        {!candidate && (
          <form
            className="next-step-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(run({ type: "next_step_due", applicationId: application.id, due }));
            }}
          >
            <label>
              Termin następnego kroku
              <Input
                type="date"
                value={due}
                required
                onChange={(event) => {
                  setSaved(false);
                  setDue(event.target.value);
                }}
              />
            </label>
            <Button type="submit" className="next-step-action">
              Zapisz termin
            </Button>
            <span role="status">{saved ? "Zapisano termin widoczny dla kandydata." : ""}</span>
          </form>
        )}
      </div>
      <div className="next-step-aside">
        {date && (
          <div className="next-step-calendar" aria-hidden="true">
            <div className="next-step-sheet">
              <span>{format(date, { month: "short" }).replace(".", "")}</span>
              <strong>{format(date, { day: "numeric" })}</strong>
            </div>
          </div>
        )}
        {candidate && (
          <Button
            className="next-step-action"
            onClick={() => document.getElementById("process-heading")?.focus()}
          >
            Zobacz historię <span aria-hidden="true">→</span>
          </Button>
        )}
      </div>
    </section>
  );
}
