import type { AxisMinimums } from "../company-data/filters";
import type { Company } from "../company-data/types";
import type {
  IkigaiAnswerDraft,
  IkigaiDraft,
  IkigaiDraftStage,
  IkigaiIscoCandidate,
  IkigaiRunRecord,
  IkigaiSelectedMatch,
  IkigaiStoragePayload,
} from "./types";

export const IKIGAI_STORAGE_KEY = "de-bedrijfskompas:ikigai:v1";
export const IKIGAI_DRAFT_STORAGE_KEY = "de-bedrijfskompas:ikigai-draft:v1";
export const IKIGAI_STORAGE_VERSION = 1;
export const IKIGAI_HISTORY_LIMIT = 10;

export interface ResolvedIkigaiMatch extends IkigaiSelectedMatch {
  company: Company;
}

export interface ResolvedIkigaiRun {
  run: IkigaiRunRecord;
  selectedMatches: ResolvedIkigaiMatch[];
  pass1Candidates: Company[];
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeAxisLevel(value: unknown): AxisMinimums[keyof AxisMinimums] {
  return value === "low" || value === "medium" || value === "high" ? value : "none";
}

function normalizeAxisMinimums(value: unknown): AxisMinimums {
  const source = isRecord(value) ? value : {};
  return {
    substance: normalizeAxisLevel(source.substance),
    ecology: normalizeAxisLevel(source.ecology),
    power: normalizeAxisLevel(source.power),
    embeddedness: normalizeAxisLevel(source.embeddedness),
    posture: normalizeAxisLevel(source.posture),
  };
}

function normalizeIscoCandidates(value: unknown): IkigaiIscoCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (
      !isRecord(candidate) ||
      typeof candidate.iscoCode !== "string" ||
      (candidate.strength !== "strong" && candidate.strength !== "weak")
    ) {
      return [];
    }
    return [{
      iscoCode: candidate.iscoCode,
      strength: candidate.strength,
      reason: typeof candidate.reason === "string" ? candidate.reason : "",
    }];
  });
}

function normalizeSelectedMatches(value: unknown): IkigaiSelectedMatch[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.companyId !== "string" || typeof item.reason !== "string") return [];
    return [{ companyId: item.companyId, reason: item.reason }];
  });
}

export function normalizeIkigaiRunRecord(value: unknown): IkigaiRunRecord | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.createdAt !== "string") return null;
  if (value.locale !== "nl" && value.locale !== "en") return null;
  if (!isRecord(value.answers)) return null;

  return {
    id: value.id,
    schemaVersion: IKIGAI_STORAGE_VERSION,
    createdAt: value.createdAt,
    parentRunId: typeof value.parentRunId === "string" ? value.parentRunId : null,
    locale: value.locale,
    answers: {
      currentWork: typeof value.answers.currentWork === "string" ? value.answers.currentWork : "",
      strengths: typeof value.answers.strengths === "string" ? value.answers.strengths : "",
      caresAbout: typeof value.answers.caresAbout === "string" ? value.answers.caresAbout : "",
      workContext: typeof value.answers.workContext === "string" ? value.answers.workContext : "",
    },
    iscoCandidates: normalizeIscoCandidates(value.iscoCandidates),
    axisMinimums: normalizeAxisMinimums(value.axisMinimums),
    deterministicCandidateIds: normalizeStringArray(value.deterministicCandidateIds),
    pass1CandidateIds: normalizeStringArray(value.pass1CandidateIds),
    selectedMatches: normalizeSelectedMatches(value.selectedMatches),
    refinements: normalizeStringArray(value.refinements),
  };
}

export function normalizeIkigaiStoragePayload(value: unknown): IkigaiStoragePayload {
  if (!isRecord(value) || !Array.isArray(value.runs)) {
    return { schemaVersion: IKIGAI_STORAGE_VERSION, runs: [] };
  }

  return {
    schemaVersion: IKIGAI_STORAGE_VERSION,
    runs: value.runs
      .map(normalizeIkigaiRunRecord)
      .filter((run): run is IkigaiRunRecord => Boolean(run))
      .slice(0, IKIGAI_HISTORY_LIMIT),
  };
}

export function readIkigaiHistory(): IkigaiStoragePayload {
  if (!canUseLocalStorage()) return { schemaVersion: IKIGAI_STORAGE_VERSION, runs: [] };

  const raw = window.localStorage.getItem(IKIGAI_STORAGE_KEY);
  if (!raw) return { schemaVersion: IKIGAI_STORAGE_VERSION, runs: [] };

  try {
    return normalizeIkigaiStoragePayload(JSON.parse(raw));
  } catch {
    return { schemaVersion: IKIGAI_STORAGE_VERSION, runs: [] };
  }
}

export function writeIkigaiHistory(payload: IkigaiStoragePayload): IkigaiStoragePayload {
  const normalized = normalizeIkigaiStoragePayload(payload);
  if (canUseLocalStorage()) {
    window.localStorage.setItem(IKIGAI_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function saveIkigaiRun(run: IkigaiRunRecord): IkigaiStoragePayload {
  const current = readIkigaiHistory();
  return writeIkigaiHistory({
    schemaVersion: IKIGAI_STORAGE_VERSION,
    runs: [run, ...current.runs.filter((stored) => stored.id !== run.id)].slice(0, IKIGAI_HISTORY_LIMIT),
  });
}

export function resolveIkigaiRunCompanies(run: IkigaiRunRecord, companies: Company[]): ResolvedIkigaiRun {
  const companyById = new Map(companies.map((company) => [company.company_id, company]));

  return {
    run,
    selectedMatches: run.selectedMatches.flatMap((match) => {
      const company = companyById.get(match.companyId);
      return company ? [{ ...match, company }] : [];
    }),
    pass1Candidates: run.pass1CandidateIds.flatMap((id) => {
      const company = companyById.get(id);
      return company ? [company] : [];
    }),
  };
}

function normalizeAnswerDraft(value: unknown): IkigaiAnswerDraft {
  if (!isRecord(value)) return {};
  const draft: IkigaiAnswerDraft = {};
  for (const id of ["currentWork", "strengths", "caresAbout", "workContext"] as const) {
    if (typeof value[id] === "string") draft[id] = value[id] as string;
  }
  return draft;
}

export function normalizeIkigaiDraft(value: unknown): IkigaiDraft | null {
  if (!isRecord(value)) return null;
  if (value.locale !== "nl" && value.locale !== "en") return null;
  const stage: IkigaiDraftStage = value.stage === "tune" ? "tune" : "questions";
  const questionStep = typeof value.questionStep === "number" && Number.isFinite(value.questionStep)
    ? Math.min(Math.max(Math.trunc(value.questionStep), 0), 3)
    : 0;

  return {
    schemaVersion: IKIGAI_STORAGE_VERSION,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date(0).toISOString(),
    stage,
    questionStep,
    locale: value.locale,
    answers: normalizeAnswerDraft(value.answers),
    axisMinimums: normalizeAxisMinimums(value.axisMinimums),
    iscoCandidates: value.iscoCandidates === null ? null : normalizeIscoCandidates(value.iscoCandidates),
    parentRunId: typeof value.parentRunId === "string" ? value.parentRunId : null,
  };
}

export function readIkigaiDraft(): IkigaiDraft | null {
  if (!canUseLocalStorage()) return null;
  const raw = window.localStorage.getItem(IKIGAI_DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeIkigaiDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeIkigaiDraft(draft: IkigaiDraft): IkigaiDraft {
  const normalized = normalizeIkigaiDraft(draft) ?? draft;
  if (canUseLocalStorage()) {
    window.localStorage.setItem(IKIGAI_DRAFT_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function clearIkigaiDraft(): void {
  if (canUseLocalStorage()) window.localStorage.removeItem(IKIGAI_DRAFT_STORAGE_KEY);
}

export function resetIkigaiHistoryForTests(): void {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(IKIGAI_STORAGE_KEY);
    window.localStorage.removeItem(IKIGAI_DRAFT_STORAGE_KEY);
  }
}
