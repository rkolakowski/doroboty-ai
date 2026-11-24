import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/form-select";
import {
  categoryLabels,
  functionLabels,
  remoteLabels,
  seniorityLabels,
  contractLabels,
} from "@/features/jobs/presentation";
import { currentPerson, jobSchema } from "./model";
import { usePrototype } from "./store";
import { Field } from "./workspace";
import { Empty, NotFound, PageTitle } from "./shell";
import {
  maxPromptLength,
  maxApplicationQuestions,
  maxOptions,
  type ApplicationQuestion,
  questionsSchema,
} from "./application-questions";

export function EmployerJobs() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const jobs = state.jobs.filter((x) => x.companyId === person.companyId);
  return (
    <>
      <PageTitle
        action={
          <Link to="/app/oferty/nowa" className={buttonVariants()}>
            Dodaj ofertę
          </Link>
        }
      >
        Moje oferty
      </PageTitle>
      <div className="space-y-4">
        {jobs.length ? (
          jobs.map((job) => (
            <article key={job.id} className="prototype-panel">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <Link
                    className="text-xl font-semibold text-[var(--gui-link)]"
                    to={`/app/oferty/${job.id}`}
                  >
                    {job.title}
                  </Link>
                  <p className="mt-3 text-muted-foreground">
                    {state.applications.filter((x) => x.jobId === job.id).length} aplikacji ·{" "}
                    {job.publicationStatus === "published" ? "Opublikowana" : "Szkic"}
                  </p>
                </div>
                <Link
                  to={`/oferty/${job.slug}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Zobacz ofertę
                </Link>
              </div>
            </article>
          ))
        ) : (
          <Empty>Nie masz jeszcze ofert. Dodaj pierwszą ofertę.</Empty>
        )}
      </div>
    </>
  );
}
export function EmployerJobEditor() {
  const { id } = useParams();
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const navigate = useNavigate();
  const existing = state.jobs.find((x) => x.id === id && x.companyId === person.companyId);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [source, setSource] = useState(existing?.sourceBrief ?? "");
  const [generated, setGenerated] = useState(existing?.generatedDescription ?? "");
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");
  const [questionRows, setQuestionRows] = useState<
    (ApplicationQuestion & { rowId: string; closed: boolean })[]
  >(() => {
    const saved: ApplicationQuestion[] =
      existing?.applicationQuestions ??
      (existing?.contributionQuestion
        ? [{ kind: "contribution" as const, prompt: existing.contributionQuestion }]
        : []);
    return saved.map((question, index) => ({
      ...question,
      closed: Boolean(question.options),
      rowId: `question-saved-${index}`,
    }));
  });
  if (id !== "nowa" && !existing) return <NotFound />;
  function publish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!approved) {
      setError("Zatwierdź opis przed publikacją.");
      return;
    }
    const data = new FormData(e.currentTarget);
    const applicationQuestions = questionsSchema.safeParse(
      questionRows.map(({ kind, rowId, closed }) => ({
        kind,
        prompt: String(data.get(rowId) ?? ""),
        options: closed
          ? String(data.get(rowId + "-options") ?? "")
              .split(/\r?\n/)
              .map((value) => value.trim())
              .filter(Boolean)
          : undefined,
      })),
    );
    if (
      !applicationQuestions.success ||
      applicationQuestions.data.length > maxApplicationQuestions
    ) {
      setError(
        `Wpisz do ${maxApplicationQuestions} pytań łącznie. Treść pytania i odpowiedzi może mieć do ${maxPromptLength} znaków. W pytaniu zamkniętym wpisz od 2 do ${maxOptions} różnych odpowiedzi.`,
      );
      return;
    }
    const newId = existing?.id ?? crypto.randomUUID();
    const parsed = jobSchema.safeParse({
      id: newId,
      slug: existing?.slug ?? `oferta-${newId}`,
      companyId: person.companyId,
      title,
      summary,
      description,
      applicationQuestions: applicationQuestions.data.length
        ? applicationQuestions.data
        : undefined,
      contributionQuestion: applicationQuestions.data.some(
        ({ kind, prompt }) => kind === "contribution" && prompt === existing?.contributionQuestion,
      )
        ? existing?.contributionQuestion
        : undefined,
      screeningIntro: String(data.get("screeningIntro") ?? "").trim() || undefined,
      sourceBrief: source,
      generatedDescription: generated,
      category: data.get("category"),
      function: data.get("function"),
      remoteStatus: data.get("remoteStatus"),
      locations: [String(data.get("location")).trim()],
      seniority: data.get("seniority"),
      contract: data.get("contract"),
      salaryMin: data.get("salaryMin") ? Number(data.get("salaryMin")) : undefined,
      salaryMax: data.get("salaryMax") ? Number(data.get("salaryMax")) : undefined,
      salaryCurrency: existing?.salaryCurrency ?? "PLN",
      salaryPeriod: existing?.salaryPeriod ?? "month",
      salaryKind: existing?.salaryKind ?? "gross",
      coordinates: (
        {
          warszawa: { latitude: 52.2297, longitude: 21.0122 },
          kraków: { latitude: 50.0647, longitude: 19.945 },
          wrocław: { latitude: 51.1079, longitude: 17.0385 },
          gdańsk: { latitude: 54.352, longitude: 18.6466 },
          poznań: { latitude: 52.4064, longitude: 16.9252 },
        } as Record<string, { latitude: number; longitude: number }>
      )[String(data.get("location")).trim().toLocaleLowerCase("pl")],
      publicationStatus: "published",
      publishedAt: existing?.publishedAt ?? new Date().toISOString(),
      expiryAt: existing?.expiryAt ?? "2099-12-31T23:59:59.000Z",
      verificationStatus: "employer_verified",
    });
    if (
      !parsed.success ||
      (parsed.data.salaryMin !== undefined &&
        parsed.data.salaryMax !== undefined &&
        parsed.data.salaryMin > parsed.data.salaryMax)
    ) {
      setError(
        "Sprawdź formularz: tytuł, lokalizacja, podsumowanie (min. 10 znaków), opis (min. 30 znaków) i widełki wynagrodzenia.",
      );
      return;
    }
    if (run({ type: "publish", job: parsed.data })) navigate("/app/oferty");
  }
  return (
    <>
      <PageTitle>{existing ? "Edytuj ofertę" : "Nowa oferta"}</PageTitle>
      <form className="prototype-form" onSubmit={publish}>
        <Field label="Nazwa stanowiska">
          <Input
            required
            maxLength={200}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setApproved(false);
            }}
          />
        </Field>
        <Field label="Brief — kogo szukasz i do jakiego zadania?">
          <Textarea
            maxLength={12000}
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setGenerated("");
              setApproved(false);
            }}
          />
        </Field>
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={source.trim().length < 20 || title.trim().length < 3}
            onClick={() => {
              setGenerated(
                `${title}\n\nO roli\n${source.trim().slice(0, 10000)}\n\nJak pracujemy\nŁączymy potrzeby użytkowników, odpowiedzialne wykorzystanie AI i mierzalne efekty.\n\nProces rekrutacji\nPrześlij aplikację i opowiedz o projekcie, w którym Twoje decyzje wpłynęły na wynik.`,
              );
              setApproved(false);
            }}
          >
            Przygotuj opis z AI
          </Button>
        </div>
        {generated && (
          <section className="prototype-panel">
            <h2 className="mb-4">Propozycja opisu</h2>
            <p className="whitespace-pre-wrap">{generated}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={() => {
                setDescription(generated);
                if (!summary) setSummary(source.slice(0, 180));
                setApproved(false);
              }}
            >
              Użyj propozycji
            </Button>
          </section>
        )}
        <Field label="Krótkie podsumowanie">
          <Textarea
            required
            minLength={10}
            maxLength={12000}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              setApproved(false);
            }}
          />
        </Field>
        <Field label="Opis oferty">
          <Textarea
            required
            minLength={30}
            maxLength={12000}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setApproved(false);
            }}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["category", "Kategoria", categoryLabels, existing?.category ?? "build"],
              ["function", "Funkcja", functionLabels, existing?.function ?? "engineering"],
              ["remoteStatus", "Tryb pracy", remoteLabels, existing?.remoteStatus ?? "hybrid"],
              ["seniority", "Poziom", seniorityLabels, existing?.seniority ?? "mid"],
              ["contract", "Umowa", contractLabels, existing?.contract ?? "employment"],
            ] as const
          ).map(([name, label, values, value]) => (
            <Field key={name} label={label}>
              <FormSelect
                name={name}
                ariaLabel={label}
                defaultValue={value}
                options={Object.entries(values).map(([value, label]) => ({ value, label }))}
              />
            </Field>
          ))}
          <Field label="Lokalizacja">
            <Input
              name="location"
              required
              maxLength={200}
              defaultValue={existing?.locations.join(" / ") ?? "Warszawa"}
            />
          </Field>
          <Field label="Wynagrodzenie od (PLN brutto / mies.)">
            <Input name="salaryMin" type="number" min="0" defaultValue={existing?.salaryMin} />
          </Field>
          <Field label="Wynagrodzenie do (PLN brutto / mies.)">
            <Input name="salaryMax" type="number" min="0" defaultValue={existing?.salaryMax} />
          </Field>
        </div>
        <fieldset className="prototype-panel space-y-4">
          <legend className="font-semibold">Pytania wstępne</legend>
          <p className="text-muted-foreground" aria-live="polite">
            Liczba pytań: {questionRows.length} z {maxApplicationQuestions} w całej ofercie.
            {questionRows.length > maxApplicationQuestions &&
              " Usuń nadmiarowe pytania przed publikacją."}
          </p>
          <Field label="Opis pytań wstępnych">
            <Textarea
              name="screeningIntro"
              maxLength={1000}
              defaultValue={existing?.screeningIntro}
              onChange={() => setApproved(false)}
              placeholder="Np. Poniższe pytania pomogą nam ustalić, czy warunki współpracy Ci odpowiadają."
            />
          </Field>
          {questionRows.length > 0 && (
            <ol className="space-y-4">
              {questionRows.map((row, index) => (
                <li
                  key={row.rowId}
                  className="space-y-3 rounded-[var(--gui-radius-m)] border border-[var(--gui-edge)] p-4"
                >
                  <Field label={`Pytanie ${index + 1}`}>
                    <Input
                      id={row.rowId}
                      name={row.rowId}
                      required
                      maxLength={maxPromptLength}
                      defaultValue={row.prompt}
                      onChange={() => setApproved(false)}
                    />
                  </Field>
                  <Field label={`Typ pytania ${index + 1}`}>
                    <select
                      className="native-select min-h-10 w-full rounded-[var(--gui-radius-s)] bg-white px-3"
                      value={row.closed ? "closed" : "text"}
                      onChange={(event) => {
                        const closed = event.target.value === "closed";
                        setQuestionRows((current) =>
                          current.map((item) =>
                            item.rowId === row.rowId ? { ...item, closed } : item,
                          ),
                        );
                        setApproved(false);
                      }}
                    >
                      <option value="text">Otwarte · odpowiedź tekstowa</option>
                      <option value="closed">Zamknięte · jednokrotny wybór</option>
                    </select>
                  </Field>
                  {row.closed && (
                    <Field label={`Opcje odpowiedzi do pytania ${index + 1}`}>
                      <Textarea
                        name={row.rowId + "-options"}
                        required
                        rows={3}
                        defaultValue={row.options?.join("\n")}
                        maxLength={maxOptions * (maxPromptLength + 1)}
                        onChange={(event) => {
                          const options = event.target.value.split("\n");
                          setQuestionRows((current) =>
                            current.map((item) =>
                              item.rowId === row.rowId ? { ...item, options } : item,
                            ),
                          );
                          setApproved(false);
                        }}
                        placeholder="Wpisz od 2 do 10 różnych odpowiedzi, po jednej w wierszu."
                      />
                    </Field>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Usuń pytanie ${index + 1}`}
                    onClick={() => {
                      const focusId =
                        questionRows[index + 1]?.rowId ??
                        questionRows[index - 1]?.rowId ??
                        "add-question";
                      setQuestionRows((current) =>
                        current.filter((item) => item.rowId !== row.rowId),
                      );
                      setApproved(false);
                      requestAnimationFrame(() => document.getElementById(focusId)?.focus());
                    }}
                  >
                    Usuń
                  </Button>
                </li>
              ))}
            </ol>
          )}
          <Button
            id="add-question"
            type="button"
            variant="outline"
            disabled={questionRows.length >= maxApplicationQuestions}
            onClick={() => {
              const rowId = `question-${crypto.randomUUID()}`;
              setQuestionRows((current) => [
                ...current,
                { kind: "screening", prompt: "", closed: false, rowId },
              ]);
              setApproved(false);
              requestAnimationFrame(() => document.getElementById(rowId)?.focus());
            }}
          >
            Dodaj pytanie
          </Button>
        </fieldset>
        <label className="flex items-start gap-3">
          <Checkbox
            checked={approved}
            onCheckedChange={setApproved}
            aria-label="Zatwierdzam treść oferty"
          />
          <span>Zatwierdzam treść oferty do publikacji.</span>
        </label>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <Button type="submit" disabled={!approved}>
          Opublikuj ofertę
        </Button>
      </form>
    </>
  );
}
export function CompanyEditor() {
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const company = state.companies.find((x) => x.id === person.companyId)!;
  const [message, setMessage] = useState("");
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (
      run({
        type: "company",
        name: String(data.get("name")),
        description: String(data.get("description")),
      })
    )
      setMessage("Dane firmy zostały zapisane.");
  }
  return (
    <>
      <PageTitle>Twoja organizacja</PageTitle>
      <form className="prototype-panel prototype-form" onSubmit={save}>
        <Field label="Nazwa firmy">
          <Input name="name" required maxLength={200} defaultValue={company.name} />
        </Field>
        <Field label="Opis firmy">
          <Textarea name="description" maxLength={12000} defaultValue={company.description} />
        </Field>
        <Button type="submit">Zapisz dane firmy</Button>
        {message && <p role="status">{message}</p>}
        <Link className="text-[var(--gui-link)]" to={`/firmy/${company.slug}`}>
          Zobacz profil firmy
        </Link>
      </form>
    </>
  );
}
