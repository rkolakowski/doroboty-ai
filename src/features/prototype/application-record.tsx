import type { ReactNode, Ref } from "react";
import { useSearchParams } from "react-router";
import { BackLink } from "@/components/back-link";
import { ProcessTimeline } from "@/components/process-timeline";
import { RecordSheet } from "@/components/record-sheet";
import { CvAttachment } from "./cv-attachment";
import { MatchScore } from "./match-score";
import { stageLabels, type Application, type Stage } from "./model";
import { NextStep } from "./next-step";
import { questionKey } from "./application-questions";
import { contributionCriterion, type ContributionReview } from "./contribution-review";

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
  review,
}: {
  application: Pick<
    Application,
    | "id"
    | "candidateId"
    | "candidateName"
    | "jobTitle"
    | "stage"
    | "answer"
    | "contributionQuestion"
    | "questionResponses"
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
  review?: ContributionReview | null;
}) {
  const candidate = audience === "candidate";
  const [params] = useSearchParams();
  const statusOnly = params.get("wariant") === "status";
  const title = candidate ? application.jobTitle : application.candidateName;
  const context = candidate ? application.candidateName : application.jobTitle;
  const submitted = history[0];
  const question = application.contributionQuestion;
  const responses = application.questionResponses ?? [];
  const card = question && (
    <section className="contribution-card" aria-label="Karta wkładu">
      <h3>Karta wkładu</h3>
      <p>
        <strong>{question}</strong>
      </p>
      <p className="whitespace-pre-wrap">{application.answer}</p>
    </section>
  );
  const cv = {
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
        {review?.showCard && card}
      </>
    ),
  };
  const answer = {
    value: "answer",
    label: responses.length ? "Odpowiedzi" : question ? "Karta wkładu" : "Odpowiedź",
    content: responses.length ? (
      <section>
        <h3>Pytania wstępne</h3>
        <dl className="space-y-4">
          {responses.map((row) => (
            <div key={questionKey(row)}>
              <dt className="font-semibold">{row.prompt}</dt>
              <dd className="whitespace-pre-wrap">{row.response}</dd>
            </div>
          ))}
        </dl>
      </section>
    ) : (
      card || (
        <>
          <h3>Przesłana aplikacja</h3>
          <p>{application.answer}</p>
        </>
      )
    ),
  };
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
            to={`${candidate ? "/app/aplikacje" : "/app/kandydaci"}${review?.search ?? (statusOnly ? "?wariant=status" : "")}`}
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
          {!review && <MatchScore score={application.score} />}
          {submitted && (
            <span>
              Złożona:{" "}
              <time dateTime={submitted.at}>{dateFormat.format(new Date(submitted.at))}</time>
            </span>
          )}
        </div>
      </header>
      {review && <p className="mt-5 text-muted-foreground">{contributionCriterion}</p>}
      {!review && !statusOnly && (
        <NextStep
          key={`${application.id}-${application.stage}`}
          application={application}
          candidate={candidate}
        />
      )}
      {candidate && <div className="next-step-history">{timeline}</div>}
      <div className={review ? "mt-8" : "recruiting-layout"}>
        <RecordSheet
          label={candidate ? "Twoja wysłana aplikacja" : "Materiały kandydata"}
          sections={review ? [cv] : [answer, cv]}
          footer={footer}
        >
          {children}
        </RecordSheet>
        {!review && (
          <aside className="recruiting-margin" aria-label="Historia i podsumowanie">
            {!candidate && timeline}
            <section className="record-summary" aria-labelledby="summary-heading">
              <h2 id="summary-heading">Podsumowanie</h2>
              <p>{application.summary}</p>
            </section>
          </aside>
        )}
      </div>
    </article>
  );
}
