import type { ByokErrorCode } from "../byok";
import type { AxisId, Company, DomainGroupId } from "../company-data/types";
import type { AxisMinimums } from "../company-data/filters";

export type IkigaiLocale = "nl" | "en";

export const IKIGAI_QUESTION_IDS = ["currentWork", "strengths", "caresAbout", "workContext"] as const;

export type IkigaiQuestionId = (typeof IKIGAI_QUESTION_IDS)[number];

export type IkigaiAnswers = Record<IkigaiQuestionId, string>;

export type IkigaiAnswerDraft = Partial<Record<IkigaiQuestionId, string>>;

export interface IkigaiQuestion {
  id: IkigaiQuestionId;
  // short eyebrow naming the ikigai circle this question probes
  eyebrow: Record<IkigaiLocale, string>;
  // the large guiding prompt shown on the wizard step
  label: Record<IkigaiLocale, string>;
  // one-line steer under the prompt
  helper: Record<IkigaiLocale, string>;
  placeholder: Record<IkigaiLocale, string>;
  // a few concrete nudges rendered as quiet chips below the field
  examples: Record<IkigaiLocale, string[]>;
  required: boolean;
}

export interface IkigaiValidationResult {
  ok: boolean;
  missing: IkigaiQuestionId[];
}

export type IkigaiIscoStrength = "strong" | "weak";

export interface IkigaiIscoCandidate {
  iscoCode: string;
  strength: IkigaiIscoStrength;
  reason: string;
}

export interface IkigaiAllowedIscoCode {
  code: string;
  label: string;
  domains: DomainGroupId[];
  companyCount: number;
}

export interface IkigaiMatchedTag {
  iscoCode: string;
  userStrength: IkigaiIscoStrength;
  companyProminence: Company["capability_tags"][number]["prominence"];
  companyConfidence: Company["capability_tags"][number]["confidence"] | "high";
  score: number;
}

export interface IkigaiCompanyCandidate {
  companyId: string;
  company: Company;
  score: number;
  matchedTags: IkigaiMatchedTag[];
}

export interface IkigaiAxisFilterState {
  axisMinimums: AxisMinimums;
  count: number;
}

export interface IkigaiPass1Output {
  candidateCompanyIds: string[];
}

export interface IkigaiSelectedMatch {
  companyId: string;
  reason: string;
}

export interface IkigaiPass2Output {
  selectedMatches: IkigaiSelectedMatch[];
}

export type IkigaiFlowError =
  | "incomplete_answers"
  | "no_allowed_isco_codes"
  | "malformed_isco_response"
  | "malformed_pass1_response"
  | "malformed_pass2_response"
  | "empty_candidate_pool"
  | ByokErrorCode;

export interface IkigaiRunRecord {
  id: string;
  schemaVersion: number;
  createdAt: string;
  parentRunId: string | null;
  locale: IkigaiLocale;
  answers: IkigaiAnswers;
  iscoCandidates: IkigaiIscoCandidate[];
  axisMinimums: AxisMinimums;
  deterministicCandidateIds: string[];
  pass1CandidateIds: string[];
  selectedMatches: IkigaiSelectedMatch[];
  refinements: string[];
}

export interface IkigaiStoragePayload {
  schemaVersion: number;
  runs: IkigaiRunRecord[];
}

// The resumable in-progress draft. Only the editing stages are persisted; once
// a run is judged it becomes a saved IkigaiRunRecord and the draft is cleared.
// Deterministic candidates are never stored — they are recomputed from the
// derived ISCO candidates against current company data on resume.
export type IkigaiDraftStage = "questions" | "tune";

export interface IkigaiDraft {
  schemaVersion: number;
  updatedAt: string;
  stage: IkigaiDraftStage;
  questionStep: number;
  locale: IkigaiLocale;
  answers: IkigaiAnswerDraft;
  axisMinimums: AxisMinimums;
  iscoCandidates: IkigaiIscoCandidate[] | null;
  parentRunId: string | null;
}

export interface IkigaiRunSuccess {
  ok: true;
  run: IkigaiRunRecord;
  deterministicCandidates: IkigaiCompanyCandidate[];
}

export interface IkigaiRunFailure {
  ok: false;
  error: IkigaiFlowError;
  answers: IkigaiAnswerDraft;
}

export type IkigaiRunResult = IkigaiRunSuccess | IkigaiRunFailure;

export interface IkigaiPreparationSuccess {
  ok: true;
  answers: IkigaiAnswers;
  iscoCandidates: IkigaiIscoCandidate[];
  deterministicCandidates: IkigaiCompanyCandidate[];
}

export type IkigaiPreparationResult = IkigaiPreparationSuccess | IkigaiRunFailure;

export interface IkigaiPromptProfile {
  id: string;
  name: string;
  tagline: string;
}

export type IkigaiAxisProfile = Record<AxisId, {
  score: number | null;
  evidence: string;
  reason: string;
}>;
