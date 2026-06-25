import { sendByokLlmRequest } from "../byok";
import type { ByokRequest, ByokResult } from "../byok";
import type { Company } from "../company-data/types";
import type { AxisMinimums } from "../company-data/filters";
import { getDefaultIkigaiAxisMinimums, applyIkigaiAxisMinimums, IKIGAI_TARGET_PRE_LLM_POOL_SIZE } from "./filters";
import { collectAllowedIkigaiIscoCodes, filterAllowedIkigaiIscoCandidates, rankIkigaiCompanyCandidates } from "./isco";
import { parseIkigaiIscoCandidates, parsePass1CandidateIds, parsePass2SelectedMatches } from "./parsers";
import { buildIkigaiCompactCompanyProfiles, buildIkigaiFullCompanyProfiles } from "./profiles";
import { buildIscoDerivationPrompt, buildPass1MatchingPrompt, buildPass2MatchingPrompt } from "./prompts";
import { toIkigaiAnswers } from "./questions";
import type {
  IkigaiAnswerDraft,
  IkigaiCompanyCandidate,
  IkigaiFlowError,
  IkigaiLocale,
  IkigaiPreparationResult,
  IkigaiPreparationSuccess,
  IkigaiRunFailure,
  IkigaiRunRecord,
  IkigaiRunResult,
} from "./types";

export type IkigaiLlmSender = (request: ByokRequest) => Promise<ByokResult>;

export interface RunIkigaiMatchingInput {
  answers: IkigaiAnswerDraft;
  companies: Company[];
  locale: IkigaiLocale;
  axisMinimums?: AxisMinimums;
  refinement?: string | null;
  parentRunId?: string | null;
  sendRequest?: IkigaiLlmSender;
  now?: () => Date;
  idFactory?: () => string;
}

export interface PrepareIkigaiCandidatesInput {
  answers: IkigaiAnswerDraft;
  companies: Company[];
  locale: IkigaiLocale;
  sendRequest?: IkigaiLlmSender;
}

export interface RunIkigaiJudgingInput {
  preparation: IkigaiPreparationSuccess;
  topPool: IkigaiCompanyCandidate[];
  locale: IkigaiLocale;
  axisMinimums: AxisMinimums;
  refinement?: string | null;
  parentRunId?: string | null;
  sendRequest?: IkigaiLlmSender;
  now?: () => Date;
  idFactory?: () => string;
}

function failure(error: IkigaiFlowError, answers: IkigaiAnswerDraft): IkigaiRunFailure {
  return { ok: false, error, answers };
}

function makeRunId(now: Date): string {
  return `ikigai-${now.toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;
}

export function buildDeterministicIkigaiPool(
  companies: Company[],
  iscoCandidates: ReturnType<typeof filterAllowedIkigaiIscoCandidates>,
  axisMinimums: AxisMinimums
): IkigaiCompanyCandidate[] {
  return applyIkigaiAxisMinimums(rankIkigaiCompanyCandidates(companies, iscoCandidates), axisMinimums);
}

export async function prepareIkigaiCandidates(input: PrepareIkigaiCandidatesInput): Promise<IkigaiPreparationResult> {
  const answers = toIkigaiAnswers(input.answers);
  if (!answers) return failure("incomplete_answers", input.answers);

  const sendRequest = input.sendRequest ?? sendByokLlmRequest;
  const allowedCodes = collectAllowedIkigaiIscoCodes(input.companies);
  if (allowedCodes.length === 0) return failure("no_allowed_isco_codes", input.answers);

  const iscoResult = await sendRequest({
    purpose: "ikigai-isco-derivation",
    category: "worker",
    responseFormat: "json",
    temperature: 0.1,
    messages: [{ role: "user", content: buildIscoDerivationPrompt(answers, allowedCodes, input.locale) }],
  });
  if (!iscoResult.ok) return failure(iscoResult.error, input.answers);

  const parsedIsco = parseIkigaiIscoCandidates(iscoResult.content);
  if (!parsedIsco) return failure("malformed_isco_response", input.answers);

  const iscoCandidates = filterAllowedIkigaiIscoCandidates(
    parsedIsco,
    allowedCodes.map((code) => code.code)
  );
  const deterministicCandidates = rankIkigaiCompanyCandidates(input.companies, iscoCandidates);
  if (deterministicCandidates.length === 0) return failure("empty_candidate_pool", input.answers);

  return { ok: true, answers, iscoCandidates, deterministicCandidates };
}

export async function runIkigaiJudging(input: RunIkigaiJudgingInput): Promise<IkigaiRunResult> {
  const sendRequest = input.sendRequest ?? sendByokLlmRequest;
  const topPool = input.topPool.slice(0, IKIGAI_TARGET_PRE_LLM_POOL_SIZE);
  if (topPool.length === 0) return failure("empty_candidate_pool", input.preparation.answers);

  const topPoolCompanies = topPool.map((candidate) => candidate.company);
  const pass1Result = await sendRequest({
    purpose: "ikigai-pass-1",
    category: "worker",
    responseFormat: "json",
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: buildPass1MatchingPrompt(
          input.preparation.answers,
          buildIkigaiCompactCompanyProfiles(topPoolCompanies, input.locale),
          input.locale,
          input.refinement
        ),
      },
    ],
  });
  if (!pass1Result.ok) return failure(pass1Result.error, input.preparation.answers);

  const pass1CandidateIds = parsePass1CandidateIds(
    pass1Result.content,
    topPool.map((candidate) => candidate.companyId)
  );
  if (!pass1CandidateIds) return failure("malformed_pass1_response", input.preparation.answers);

  const pass1Companies = pass1CandidateIds
    .map((id) => topPool.find((candidate) => candidate.companyId === id)?.company)
    .filter((company): company is Company => Boolean(company));
  const pass2Result = await sendRequest({
    purpose: "ikigai-pass-2",
    category: "worker",
    responseFormat: "json",
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: buildPass2MatchingPrompt(
          input.preparation.answers,
          buildIkigaiFullCompanyProfiles(pass1Companies, input.locale),
          input.locale,
          input.refinement
        ),
      },
    ],
  });
  if (!pass2Result.ok) return failure(pass2Result.error, input.preparation.answers);

  const selectedMatches = parsePass2SelectedMatches(pass2Result.content, pass1CandidateIds);
  if (!selectedMatches) return failure("malformed_pass2_response", input.preparation.answers);

  const now = (input.now ?? (() => new Date()))();
  const run: IkigaiRunRecord = {
    id: input.idFactory?.() ?? makeRunId(now),
    schemaVersion: 1,
    createdAt: now.toISOString(),
    parentRunId: input.parentRunId ?? null,
    locale: input.locale,
    answers: input.preparation.answers,
    iscoCandidates: input.preparation.iscoCandidates,
    axisMinimums: input.axisMinimums,
    deterministicCandidateIds: topPool.map((candidate) => candidate.companyId),
    pass1CandidateIds,
    selectedMatches,
    refinements: input.refinement?.trim() ? [input.refinement.trim()] : [],
  };

  return { ok: true, run, deterministicCandidates: topPool };
}

export async function runIkigaiMatching(input: RunIkigaiMatchingInput): Promise<IkigaiRunResult> {
  const preparation = await prepareIkigaiCandidates(input);
  if (!preparation.ok) return preparation;

  const axisMinimums = input.axisMinimums ?? getDefaultIkigaiAxisMinimums();
  const topPool = applyIkigaiAxisMinimums(preparation.deterministicCandidates, axisMinimums);

  return runIkigaiJudging({
    preparation,
    topPool,
    locale: input.locale,
    axisMinimums,
    refinement: input.refinement,
    parentRunId: input.parentRunId,
    sendRequest: input.sendRequest,
    now: input.now,
    idFactory: input.idFactory,
  });
}
