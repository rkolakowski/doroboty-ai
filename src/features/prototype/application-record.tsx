import type { ReactNode, Ref } from "react";
import { useSearchParams } from "react-router";
import { BackLink } from "@/components/back-link";
import { ProcessTimeline } from "@/components/process-timeline";
import { RecordSheet } from "@/components/record-sheet";
import { CvAttachment } from "./cv-attachment";
import { MatchScore } from "./match-score";
import { stageLabels, type Application, type Stage } from "./model";
import { NextStep } from "./next-step";

type RecordEvent = { stage: Stage; at: string; note?: string };
const dateFormat = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Role controllers authorize the record and project the history before rendering. */
export function ApplicationRecord({
  application,
  companyName,
  audience,
  history,
  statusRef,
  children,
  footer,
}: {
  application: Pick<
    Application,
    | "id"
    | "candidateId"
    | "candidateName"
    | "jobTitle"
    | "stage"
    | "answer"
    | "cv"
    | "score"
    | "summary"
    | "nextStepDue"
  >;
  companyName: string;
  audience: "candidate" | "employer";
  history: RecordEvent[];
  statusRef?: Ref<HTMLSpanElement>;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const candidate = audience === "candidate";
  const [params] = useSearchParams();
  const statusOnly = params.get("wariant") === "status";
  const title = candidate ? application.jobTitle : application.candidateName;
  const context = candidate ? application.candidateName : application.jobTitle;
  const submitted = history[0];
  const timeline = (
    <section aria-labelledby="process-heading">
      <h2 id="process-heading" tabIndex={-1}>
        Historia procesu
      </h2>
      <ProcessTimeline
        items={history.map((event, index) => ({
          id: `${index}-${event.at}`,
          title: event.stage === "reviewed" ? "Aplikacja przejrzana" : stageLabels[event.stage],
          dateTime: event.at,
          content: event.note || undefined,
        }))}
      />
    </section>
  );
  return (
    <article className="recruiting-record next-step-record">
      <header className="recruiting-header">
        <nav aria-label="Ścieżka nawigacji" className="record-breadcrumb">
          <BackLink
            to={`${candidate ? "/app/aplikacje" : "/app/kandydaci"}${statusOnly ? "?wariant=status" : ""}`}
          >
            {candidate ? "Moje aplikacje" : "Kandydaci"}
          </BackLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <h1>{title}</h1>
        <div className="record-meta">
          <span>
            {context} · {companyName}
          </span>
          <span className="record-stage" tabIndex={-1} ref={statusRef}>
            {stageLabels[application.stage]}
          </span>
          <MatchScore score={application.score} />
          {submitted && (
            <span>
              Złożona:{" "}
              <time dateTime={submitted.at}>{dateFormat.format(new Date(submitted.at))}</time>
            </span>
          )}
        </div>
      </header>
      {!statusOnly && (
        <NextStep
          key={`${application.id}-${application.stage}`}
          application={application}
          candidate={candidate}
        />
      )}
      {candidate && <div className="next-step-history">{timeline}</div>}
      <div className="recruiting-layout">
        <RecordSheet
          label={candidate ? "Twoja wysłana aplikacja" : "Materiały kandydata"}
          sections={[
            {
              value: "answer",
              label: "Odpowiedź",
              content: (
                <>
                  <h3>Przesłana aplikacja</h3>
                  <p>{application.answer}</p>
                </>
              ),
            },
            {
              value: "cv",
              label: "CV",
              content: (
                <>
                  <h3>CV z momentu aplikowania</h3>
                  <CvAttachment
                    candidateId={application.candidateId}
                    fallbackText={application.cv}
                    layout="row"
                    preview
                  />
                </>
              ),
            },
          ]}
          footer={footer}
        >
          {children}
        </RecordSheet>
        <aside className="recruiting-margin" aria-label="Historia i podsumowanie">
          {!candidate && timeline}
          <section className="record-summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Podsumowanie</h2>
            <p>{application.summary}</p>
          </section>
        </aside>
      </div>
    </article>
  );
}
