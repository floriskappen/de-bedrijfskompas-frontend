import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AxisId, Company } from "../lib/company-data/types";
import { AXIS_IDS } from "../lib/company-data/types";
import { DEFAULT_AXIS_MINIMUMS, type AxisMinimums } from "../lib/company-data/filters";
import { FOCUS_LEVEL_ORDER, getFocusLevel, type FocusLevel } from "../lib/company-data/focus-level";
import { getAxisLabel, getFocusMinimumLabel } from "../lib/i18n/labels";
import { t, type MessageKey } from "../lib/i18n";
import {
  IKIGAI_QUESTIONS,
  IKIGAI_STORAGE_VERSION,
  IKIGAI_TARGET_PRE_LLM_POOL_SIZE,
  applyIkigaiAxisMinimums,
  clearIkigaiDraft,
  prepareIkigaiCandidates,
  rankIkigaiCompanyCandidates,
  readIkigaiDraft,
  readIkigaiHistory,
  resolveIkigaiRunCompanies,
  runIkigaiJudging,
  saveIkigaiRun,
  toIkigaiAnswers,
  writeIkigaiDraft,
  type IkigaiAnswerDraft,
  type IkigaiCompanyCandidate,
  type IkigaiDraft,
  type IkigaiFlowError,
  type IkigaiIscoCandidate,
  type IkigaiLlmSender,
  type IkigaiPreparationSuccess,
  type IkigaiRunRecord,
} from "../lib/ikigai";
import FocusMeter from "./FocusMeter";

interface IkigaiFlowDialogProps {
  open: boolean;
  locale: "nl" | "en";
  companies: Company[];
  // Runs `onConfirmed` once a usable LLM key is confirmed for this session,
  // opening the BYOK setup first when one is not yet present.
  onRequestByok: (onConfirmed: () => void) => void;
  onClose: () => void;
}

type IkigaiWindow = Window & { __ikigaiSendRequest?: IkigaiLlmSender };

type View = "menu" | "wizard";
type Stage = "questions" | "deriving" | "tune" | "judging" | "results" | "refine";

const ERROR_KEYS: Record<IkigaiFlowError, MessageKey> = {
  incomplete_answers: "ikigai_error_incomplete",
  no_allowed_isco_codes: "ikigai_error_empty",
  malformed_isco_response: "ikigai_error_model",
  malformed_pass1_response: "ikigai_error_model",
  malformed_pass2_response: "ikigai_error_model",
  empty_candidate_pool: "ikigai_error_empty",
  missing_config: "byok_error_missing_config",
  invalid_key: "byok_error_invalid_key",
  insufficient_credit: "byok_error_insufficient_credit",
  allowance_exceeded: "byok_error_allowance_exceeded",
  rate_limited: "byok_error_rate_limited",
  network_error: "byok_error_network_error",
  malformed_response: "byok_error_malformed_response",
};

// A growing seed head in Vogel golden-angle order — the ontwerp "germinating"
// loading state ported from vendor/ontwerp. Each seed pops in on a stagger keyed
// to its index, so the spiral grows outward and clears, then grows again.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const GERMINATING_SEEDS = Array.from({ length: 44 }, (_, i) => {
  const a = i * GOLDEN_ANGLE;
  const rad = 3.3 * Math.sqrt(i);
  return {
    i,
    x: Number((Math.cos(a) * rad).toFixed(2)),
    y: Number((Math.sin(a) * rad).toFixed(2)),
    r: Number((0.8 + i * 0.014).toFixed(2)),
  };
});

function getDetailHref(companyId: string, locale: "nl" | "en"): string {
  return locale === "en" ? `/en/${companyId}/` : `/${companyId}/`;
}

function preparationFromRun(run: IkigaiRunRecord | null, companies: Company[]): IkigaiPreparationSuccess | null {
  if (!run) return null;
  const companyById = new Map(companies.map((company) => [company.company_id, company]));
  const deterministicCandidates: IkigaiCompanyCandidate[] = run.deterministicCandidateIds.flatMap((companyId) => {
    const company = companyById.get(companyId);
    return company ? [{ companyId, company, score: 0, matchedTags: [] }] : [];
  });

  return {
    ok: true,
    answers: run.answers,
    iscoCandidates: run.iscoCandidates,
    deterministicCandidates,
  };
}

function preparationFromIsco(
  answers: IkigaiAnswerDraft,
  iscoCandidates: IkigaiIscoCandidate[],
  companies: Company[]
): IkigaiPreparationSuccess | null {
  const full = toIkigaiAnswers(answers);
  if (!full) return null;
  return {
    ok: true,
    answers: full,
    iscoCandidates,
    deterministicCandidates: rankIkigaiCompanyCandidates(companies, iscoCandidates),
  };
}

// The germinating seed head is both the loading state and the error state for a
// pass: while the model works it grows; when a pass fails the growth halts in
// place and the same surface carries the message + recovery actions, so the
// visitor never jumps to a separate flat error card mid-flow.
function GerminatingState({
  caption,
  sub,
  error,
  retryLabel,
  backLabel,
  onRetry,
  onBack,
}: {
  caption: string;
  sub: string;
  error?: string | null;
  retryLabel?: string;
  backLabel?: string;
  onRetry?: () => void;
  onBack?: () => void;
}) {
  const isError = Boolean(error);
  return (
    <div
      className={`ikigai-loading${isError ? " is-error" : ""}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <svg className="ikigai-seedhead" viewBox="-26 -26 52 52" aria-hidden="true" focusable="false">
        {GERMINATING_SEEDS.map((seed) => (
          <circle
            key={seed.i}
            className="ikigai-gseed"
            style={{ "--gi": seed.i } as React.CSSProperties}
            cx={seed.x}
            cy={seed.y}
            r={seed.r}
          />
        ))}
      </svg>
      {isError ? (
        <>
          <p id="ikigai-error" className="ikigai-loading-caption">
            {error}
          </p>
          <div className="ikigai-loading-actions">
            {onBack && (
              <button type="button" className="ontwerp-button" onClick={onBack}>
                {backLabel}
              </button>
            )}
            {onRetry && (
              <button type="button" className="ontwerp-button is-accent" onClick={onRetry}>
                {retryLabel}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="ikigai-loading-caption">{caption}</p>
          <p className="ikigai-loading-sub">{sub}</p>
        </>
      )}
    </div>
  );
}

function ResultCard({
  match,
  locale,
}: {
  match: ReturnType<typeof resolveIkigaiRunCompanies>["selectedMatches"][number];
  locale: "nl" | "en";
}) {
  const city = match.company.address?.city ?? t("address_fallback", locale);
  const tagline =
    match.company[locale]?.tagline ||
    match.company[locale === "en" ? "nl" : "en"]?.tagline ||
    t("tagline_fallback", locale);

  return (
    <article className="ikigai-result-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3>{match.company.name}</h3>
          <p className="ikigai-muted">{city}</p>
        </div>
        <a className="ontwerp-button is-compact" href={getDetailHref(match.company.company_id, locale)}>
          {t("cta", locale)}
        </a>
      </div>
      <p className="mt-3">{tagline}</p>
      <div className="ikigai-axis-row mt-3" aria-label={t("ikigai_axis_summary", locale)}>
        {AXIS_IDS.map((axis) => (
          <FocusMeter key={axis} level={getFocusLevel(match.company.scores[axis].score)} label={getAxisLabel(axis, locale)} />
        ))}
      </div>
      <p className="ikigai-reason mt-3">{match.reason}</p>
    </article>
  );
}

function CandidateCard({ company, locale }: { company: Company; locale: "nl" | "en" }) {
  const tagline =
    company[locale]?.tagline || company[locale === "en" ? "nl" : "en"]?.tagline || t("tagline_fallback", locale);

  return (
    <a className="ikigai-candidate-card" href={getDetailHref(company.company_id, locale)}>
      <span>{company.name}</span>
      <small>{tagline}</small>
    </a>
  );
}

export default function IkigaiFlowDialog({ open, locale, companies, onRequestByok, onClose }: IkigaiFlowDialogProps) {
  const [view, setView] = useState<View>("menu");
  const [stage, setStage] = useState<Stage>("questions");
  const [questionStep, setQuestionStep] = useState(0);
  const [answers, setAnswers] = useState<IkigaiAnswerDraft>({});
  const [axisMinimums, setAxisMinimums] = useState<AxisMinimums>({ ...DEFAULT_AXIS_MINIMUMS });
  const [preparation, setPreparation] = useState<IkigaiPreparationSuccess | null>(null);
  const [history, setHistory] = useState<IkigaiRunRecord[]>([]);
  const [draft, setDraft] = useState<IkigaiDraft | null>(null);
  const [activeRun, setActiveRun] = useState<IkigaiRunRecord | null>(null);
  const [parentRunId, setParentRunId] = useState<string | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [refinement, setRefinement] = useState("");
  const [showBroader, setShowBroader] = useState(false);

  const sheetRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ startY: number; height: number } | null>(null);
  const judgeOriginRef = useRef<Stage>("tune");

  const getSendRequest = (): IkigaiLlmSender | undefined =>
    typeof window !== "undefined" ? (window as IkigaiWindow).__ikigaiSendRequest : undefined;

  // ───────── flow transitions ─────────

  const enterWizardFresh = () => {
    setAnswers({});
    setAxisMinimums({ ...DEFAULT_AXIS_MINIMUMS });
    setPreparation(null);
    setActiveRun(null);
    setParentRunId(null);
    setRefinement("");
    setError(null);
    setShowBroader(false);
    setQuestionStep(0);
    setStage("questions");
    setView("wizard");
  };

  const beginNewRun = () => {
    clearIkigaiDraft();
    setDraft(null);
    onRequestByok(enterWizardFresh);
  };

  const resumeDraft = (saved: IkigaiDraft) => {
    onRequestByok(() => {
      setAnswers(saved.answers);
      setAxisMinimums(saved.axisMinimums);
      setParentRunId(saved.parentRunId);
      setActiveRun(null);
      setRefinement("");
      setError(null);
      setShowBroader(false);

      const resumedPreparation =
        saved.stage === "tune" && saved.iscoCandidates && saved.iscoCandidates.length > 0
          ? preparationFromIsco(saved.answers, saved.iscoCandidates, companies)
          : null;

      if (resumedPreparation) {
        setPreparation(resumedPreparation);
        setStage("tune");
      } else {
        setPreparation(null);
        setQuestionStep(Math.min(saved.questionStep, IKIGAI_QUESTIONS.length - 1));
        setStage("questions");
      }
      setView("wizard");
    });
  };

  const discardDraft = () => {
    clearIkigaiDraft();
    setDraft(null);
    if (history.length === 0) beginNewRun();
  };

  const openSavedRun = (run: IkigaiRunRecord) => {
    setActiveRun(run);
    setParentRunId(run.id);
    setPreparation(preparationFromRun(run, companies));
    setAxisMinimums(run.axisMinimums);
    setError(null);
    setShowBroader(false);
    setRefinement("");
    setStage("results");
    setView("wizard");
  };

  // ───────── open / reset ─────────

  useEffect(() => {
    if (!open) return;
    const runs = readIkigaiHistory().runs;
    const savedDraft = readIkigaiDraft();
    setHistory(runs);
    setDraft(savedDraft);
    setError(null);
    setShowBroader(false);
    setRefinement("");
    setActiveRun(null);
    setPreparation(null);

    if (runs.length === 0 && !savedDraft) {
      // nothing to choose from — straight into a fresh run (BYOK first if needed)
      beginNewRun();
    } else {
      setView("menu");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Persist the in-progress draft while editing, so a closed run can be resumed.
  // Loading/result stages are transient and never written; a blank questionnaire
  // is not worth resuming, so it is not stored either.
  useEffect(() => {
    if (!open || view !== "wizard") return;
    if (stage !== "questions" && stage !== "tune") return;
    const hasContent = stage === "tune" || Object.values(answers).some((value) => (value ?? "").trim().length > 0);
    if (!hasContent) return;

    writeIkigaiDraft({
      schemaVersion: IKIGAI_STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      stage: stage === "tune" ? "tune" : "questions",
      questionStep,
      locale,
      answers,
      axisMinimums,
      iscoCandidates: preparation?.iscoCandidates ?? null,
      parentRunId,
    });
  }, [open, view, stage, questionStep, answers, axisMinimums, preparation, parentRunId, locale]);

  // Escape closes the whole flow.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ───────── derived candidate pool ─────────

  const resolvedRun = useMemo(
    () => (activeRun ? resolveIkigaiRunCompanies(activeRun, companies) : null),
    [activeRun, companies]
  );
  const selectedIds = useMemo(
    () => new Set(resolvedRun?.selectedMatches.map((match) => match.company.company_id) ?? []),
    [resolvedRun]
  );
  const broaderCandidates = useMemo(
    () => resolvedRun?.pass1Candidates.filter((company) => !selectedIds.has(company.company_id)) ?? [],
    [resolvedRun, selectedIds]
  );
  const filteredCandidates = useMemo(
    () => (preparation ? applyIkigaiAxisMinimums(preparation.deterministicCandidates, axisMinimums) : []),
    [preparation, axisMinimums]
  );
  const topPool = useMemo(() => filteredCandidates.slice(0, IKIGAI_TARGET_PRE_LLM_POOL_SIZE), [filteredCandidates]);

  // ───────── LLM stages ─────────

  const derive = async () => {
    setError(null);
    setStage("deriving");
    const result = await prepareIkigaiCandidates({ answers, companies, locale, sendRequest: getSendRequest() });
    if (!result.ok) {
      setError(ERROR_KEYS[result.error]);
      return;
    }
    setActiveRun(null);
    setPreparation(result);
    setStage("tune");
  };

  const runJudging = async (nextRefinement?: string) => {
    const activePreparation = preparation ?? preparationFromRun(activeRun, companies);
    if (!activePreparation) {
      setError("ikigai_error_prepare_first");
      return;
    }
    const pool = preparation ? topPool : activePreparation.deterministicCandidates;
    setError(null);
    setStage("judging");

    const result = await runIkigaiJudging({
      preparation: activePreparation,
      topPool: pool,
      locale,
      axisMinimums,
      refinement: nextRefinement,
      parentRunId,
      sendRequest: getSendRequest(),
    });

    if (!result.ok) {
      setError(ERROR_KEYS[result.error]);
      return;
    }

    const nextHistory = saveIkigaiRun(result.run);
    clearIkigaiDraft();
    setDraft(null);
    setHistory(nextHistory.runs);
    setActiveRun(result.run);
    setParentRunId(result.run.id);
    setShowBroader(false);
    setRefinement("");
    setStage("results");
  };

  const startJudgingFromTune = () => {
    judgeOriginRef.current = "tune";
    void runJudging();
  };

  const openRefine = () => {
    onRequestByok(() => {
      setRefinement("");
      setError(null);
      setStage("refine");
    });
  };

  const submitRefine = () => {
    if (!refinement.trim()) return;
    judgeOriginRef.current = "refine";
    void runJudging(refinement);
  };

  const updateAxisMinimum = (axis: AxisId, level: FocusLevel) => {
    setAxisMinimums((current) => ({ ...current, [axis]: level }));
  };

  // ───────── question step navigation ─────────

  const currentQuestion = IKIGAI_QUESTIONS[questionStep];
  const currentAnswer = answers[currentQuestion.id] ?? "";
  const canAdvance = currentAnswer.trim().length > 0;
  const isLastQuestion = questionStep === IKIGAI_QUESTIONS.length - 1;

  const setCurrentAnswer = (value: string) => {
    setAnswers((current) => ({ ...current, [currentQuestion.id]: value }));
  };

  const appendExample = (text: string) => {
    setAnswers((current) => {
      const existing = (current[currentQuestion.id] ?? "").trim();
      const next = existing ? `${existing}, ${text}` : text;
      return { ...current, [currentQuestion.id]: next };
    });
  };

  const goNextQuestion = () => {
    if (!canAdvance) return;
    if (isLastQuestion) void derive();
    else setQuestionStep((step) => step + 1);
  };

  const goPrevQuestion = () => {
    if (questionStep > 0) setQuestionStep((step) => step - 1);
  };

  // ───────── menu drag-to-dismiss ─────────

  const onHandleDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = sheetRef.current;
    if (!el) return;
    dragRef.current = { startY: event.clientY, height: el.getBoundingClientRect().height };
    event.currentTarget.setPointerCapture(event.pointerId);
    el.style.animation = "none";
    el.style.transition = "none";
  };

  const onHandleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    const el = sheetRef.current;
    if (!state || !el) return;
    const raw = event.clientY - state.startY;
    const y = raw >= 0 ? raw : Math.max(-20, raw / 6);
    el.style.transform = `translateY(${y}px)`;
  };

  const onHandleUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    const el = sheetRef.current;
    if (!state || !el) return;
    const raw = event.clientY - state.startY;
    dragRef.current = null;
    el.style.transition = "transform 160ms steps(4, end)";
    if (raw > state.height * 0.3) {
      el.addEventListener("transitionend", () => onClose(), { once: true });
      el.style.transform = `translateY(${state.height}px)`;
    } else {
      el.style.transform = "translateY(0px)";
    }
  };

  if (!open || typeof document === "undefined") return null;

  // ───────── menu / run selection (bottom sheet) ─────────

  if (view === "menu") {
    return createPortal(
      <div className="filter-backdrop fixed inset-0 z-[70] flex items-end" onClick={onClose} data-ikigai-backdrop>
        <section
          ref={sheetRef}
          id="ikigai-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t("ikigai_title", locale)}
          className="ikigai-menu-sheet ontwerp-sheet max-h-[86vh] w-full overflow-y-auto pb-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="ikigai-drag-zone"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
          >
            <span className="drag-handle-bar" aria-hidden="true" />
          </div>

          <div className="ikigai-menu-head">
            <div>
              <p className="ontwerp-badge">{t("ikigai_badge", locale)}</p>
              <h2 className="ikigai-menu-title mt-2">{t("ikigai_title", locale)}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close_label", locale)}
              className="ontwerp-icon-button is-compact"
            >
              ×
            </button>
          </div>

          <p className="ikigai-menu-intro">{t("ikigai_menu_intro", locale)}</p>

          {draft && (
            <div className="ikigai-resume-card">
              <div>
                <p className="ikigai-resume-title">{t("ikigai_resume_title", locale)}</p>
                <p className="ikigai-muted">{t("ikigai_resume_hint", locale)}</p>
              </div>
              <div className="ikigai-resume-actions">
                <button type="button" className="ontwerp-button is-compact" onClick={discardDraft}>
                  {t("ikigai_discard", locale)}
                </button>
                <button
                  id="ikigai-resume"
                  type="button"
                  className="ontwerp-button is-accent is-compact"
                  onClick={() => resumeDraft(draft)}
                >
                  {t("ikigai_resume", locale)}
                </button>
              </div>
            </div>
          )}

          <button id="ikigai-new" type="button" className="ontwerp-button is-accent ikigai-new-button" onClick={beginNewRun}>
            {t("ikigai_new_run", locale)}
          </button>

          {history.length > 0 && (
            <section className="ikigai-history">
              <h3 className="ikigai-section-label">{t("ikigai_history", locale)}</h3>
              <div className="ikigai-history-list">
                {history.map((run) => {
                  const count = run.selectedMatches.length;
                  return (
                    <button
                      key={run.id}
                      type="button"
                      className="ikigai-history-item"
                      onClick={() => openSavedRun(run)}
                    >
                      <span className="ikigai-history-date">
                        {new Date(run.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="ikigai-history-meta">
                        {run.refinements.length > 0 ? run.refinements[run.refinements.length - 1] : t("ikigai_run_word", locale)}
                      </span>
                      <span className="ikigai-history-count font-mono">
                        {count === 1 ? t("ikigai_history_one_match", locale) : `${count} ${t("ikigai_history_matches", locale)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </section>
      </div>,
      document.body
    );
  }

  // ───────── fullscreen wizard ─────────

  const phaseLabel: Record<Stage, string> = {
    questions: "",
    deriving: "",
    tune: t("ikigai_tune_title", locale),
    judging: "",
    results: t("ikigai_results", locale),
    refine: t("ikigai_refine_title", locale),
  };

  return createPortal(
    <div
      id="ikigai-flow"
      role="dialog"
      aria-modal="true"
      aria-label={t("ikigai_title", locale)}
      className="ikigai-fullscreen fixed inset-0 z-[75] flex flex-col"
    >
      <header className="ikigai-wizard-top">
        <div className="ikigai-wizard-top-left">
          <span className="ontwerp-badge">{t("ikigai_badge", locale)}</span>
          {stage === "questions" ? (
            <div className="ikigai-progress" aria-hidden="true">
              {IKIGAI_QUESTIONS.map((question, index) => (
                <span
                  key={question.id}
                  className={`ikigai-progress-dot${index === questionStep ? " is-active" : ""}${
                    index < questionStep ? " is-done" : ""
                  }`}
                />
              ))}
              <span className="ikigai-progress-label font-mono">
                {t("ikigai_step", locale)} {questionStep + 1} / {IKIGAI_QUESTIONS.length}
              </span>
            </div>
          ) : (
            phaseLabel[stage] && <span className="ikigai-phase-label">{phaseLabel[stage]}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close_label", locale)}
          className="ontwerp-icon-button is-compact"
        >
          ×
        </button>
      </header>

      <div className="ikigai-wizard-body">
        {stage === "questions" && (
          <div className="ikigai-question" key={currentQuestion.id}>
            <p className="ikigai-question-eyebrow font-mono">{currentQuestion.eyebrow[locale]}</p>
            <h2 className="ikigai-question-prompt">{currentQuestion.label[locale]}</h2>
            <p className="ikigai-question-helper">{currentQuestion.helper[locale]}</p>
            <textarea
              className="ikigai-answer"
              autoFocus
              value={currentAnswer}
              placeholder={currentQuestion.placeholder[locale]}
              onChange={(event) => setCurrentAnswer(event.currentTarget.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") goNextQuestion();
              }}
            />
            <div className="ikigai-examples">
              {currentQuestion.examples[locale].map((example) => (
                <button key={example} type="button" className="ikigai-example" onClick={() => appendExample(example)}>
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "deriving" && (
          <GerminatingState
            caption={t("ikigai_loading_derive", locale)}
            sub={t("ikigai_loading_patience", locale)}
            error={error ? t(error, locale) : null}
            retryLabel={t("ikigai_error_retry", locale)}
            backLabel={t("ikigai_back", locale)}
            onRetry={() => onRequestByok(() => void derive())}
            onBack={() => {
              setError(null);
              setStage("questions");
              setQuestionStep(IKIGAI_QUESTIONS.length - 1);
            }}
          />
        )}

        {stage === "tune" && (
          <div id="ikigai-candidate-review" className="ikigai-tune">
            <p className="ikigai-stage-intro">{t("ikigai_tune_intro", locale)}</p>

            <section className="ikigai-tune-block">
              <h3 className="ikigai-section-label">{t("ikigai_isco_label", locale)}</h3>
              <div className="ikigai-chip-row" id="ikigai-isco-tags">
                {preparation?.iscoCandidates.map((candidate) => (
                  <span key={candidate.iscoCode} className="filter-chip" data-ikigai-isco={candidate.iscoCode}>
                    <span>{candidate.iscoCode}</span>
                    <span className="font-mono text-[9px]">{candidate.strength}</span>
                  </span>
                ))}
              </div>
            </section>

            <section className="ikigai-pool">
              <div className="ikigai-pool-head">
                <span className="ontwerp-badge">{filteredCandidates.length}</span>
                <span className="ikigai-section-label">{t("ikigai_pool_label", locale)}</span>
              </div>
              <p className="ikigai-pool-hint">
                {filteredCandidates.length > IKIGAI_TARGET_PRE_LLM_POOL_SIZE
                  ? t("ikigai_pool_large_hint", locale)
                  : t("ikigai_pool_ready_hint", locale)}
              </p>
            </section>

            <section className="ikigai-tune-block">
              <h4 className="ikigai-section-label">{t("ikigai_axis_tightening", locale)}</h4>
              <div className="ikigai-axes">
                {AXIS_IDS.map((axis) => (
                  <div key={axis} className="ikigai-axis-control">
                    <span>{getAxisLabel(axis, locale)}</span>
                    <div>
                      {FOCUS_LEVEL_ORDER.map((level) => (
                        <button
                          key={level}
                          type="button"
                          aria-pressed={axisMinimums[axis] === level}
                          onClick={() => updateAxisMinimum(axis, level)}
                        >
                          {getFocusMinimumLabel(level, locale)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {topPool.length > 0 && (
              <section className="ikigai-pool-preview" id="ikigai-deterministic-candidates">
                {topPool.slice(0, 6).map((candidate) => (
                  <CandidateCard key={candidate.companyId} company={candidate.company} locale={locale} />
                ))}
              </section>
            )}
          </div>
        )}

        {stage === "judging" && (
          <GerminatingState
            caption={t("ikigai_loading_judge", locale)}
            sub={t("ikigai_loading_patience", locale)}
            error={error ? t(error, locale) : null}
            retryLabel={t("ikigai_error_retry", locale)}
            backLabel={t("ikigai_back", locale)}
            onRetry={() =>
              onRequestByok(() => void runJudging(judgeOriginRef.current === "refine" ? refinement : undefined))
            }
            onBack={() => {
              setError(null);
              setStage(judgeOriginRef.current);
            }}
          />
        )}

        {stage === "results" && resolvedRun && (
          <div id="ikigai-results" className="ikigai-results">
            <p className="ikigai-stage-intro">{t("ikigai_results_intro", locale)}</p>
            <div className="ikigai-results-list">
              {resolvedRun.selectedMatches.map((match) => (
                <ResultCard key={match.company.company_id} match={match} locale={locale} />
              ))}
            </div>

            {broaderCandidates.length > 0 && (
              <div className="ikigai-broader">
                <button
                  id="ikigai-toggle-broader"
                  type="button"
                  className="ontwerp-button"
                  onClick={() => setShowBroader((current) => !current)}
                >
                  {showBroader ? t("ikigai_broader_hide", locale) : t("ikigai_broader_candidates", locale)}
                </button>
                {showBroader && (
                  <div id="ikigai-broader-candidates" className="ikigai-pool-preview mt-3">
                    {broaderCandidates.map((company) => (
                      <CandidateCard key={company.company_id} company={company} locale={locale} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {stage === "refine" && (
          <div className="ikigai-refine">
            <h2 className="ikigai-question-prompt">{t("ikigai_refine_title", locale)}</h2>
            <p className="ikigai-question-helper">{t("ikigai_refine_hint", locale)}</p>
            <textarea
              id="ikigai-refine-input"
              className="ikigai-answer"
              autoFocus
              value={refinement}
              placeholder={t("ikigai_refine_placeholder", locale)}
              onChange={(event) => setRefinement(event.currentTarget.value)}
            />
          </div>
        )}
      </div>

      {/* contextual action bar */}
      {stage === "questions" && (
        <footer className="ikigai-wizard-foot">
          <button
            type="button"
            className="ontwerp-button"
            onClick={questionStep === 0 ? onClose : goPrevQuestion}
          >
            {questionStep === 0 ? t("close_label", locale) : t("ikigai_back", locale)}
          </button>
          <button id="ikigai-next" type="button" className="ontwerp-button is-accent" disabled={!canAdvance} onClick={goNextQuestion}>
            {t("ikigai_next", locale)}
          </button>
        </footer>
      )}

      {stage === "tune" && (
        <footer className="ikigai-wizard-foot">
          <button
            type="button"
            className="ontwerp-button"
            onClick={() => {
              setStage("questions");
              setQuestionStep(IKIGAI_QUESTIONS.length - 1);
            }}
          >
            {t("ikigai_back", locale)}
          </button>
          <button
            id="ikigai-run"
            type="button"
            className="ontwerp-button is-accent"
            disabled={topPool.length === 0}
            onClick={startJudgingFromTune}
          >
            {t("ikigai_run", locale)}
          </button>
        </footer>
      )}

      {stage === "results" && (
        <footer className="ikigai-wizard-foot is-spread">
          <button type="button" className="ontwerp-button" onClick={beginNewRun}>
            {t("ikigai_start_over", locale)}
          </button>
          <button id="ikigai-refine-open" type="button" className="ontwerp-button is-accent" onClick={openRefine}>
            {t("ikigai_refine_open", locale)}
          </button>
        </footer>
      )}

      {stage === "refine" && (
        <footer className="ikigai-wizard-foot">
          <button type="button" className="ontwerp-button" onClick={() => setStage("results")}>
            {t("ikigai_refine_cancel", locale)}
          </button>
          <button
            id="ikigai-refine"
            type="button"
            className="ontwerp-button is-accent"
            disabled={!refinement.trim()}
            onClick={submitRefine}
          >
            {t("ikigai_refine_run", locale)}
          </button>
        </footer>
      )}
    </div>,
    document.body
  );
}
