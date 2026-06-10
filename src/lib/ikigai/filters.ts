import type { Company } from "../company-data/types";
import type { AxisMinimums } from "../company-data/filters";
import { matchesAxisMinimum } from "../company-data/filters";
import { DEFAULT_AXIS_MINIMUMS } from "../company-data/filters";
import { AXIS_IDS } from "../company-data/types";
import type { IkigaiCompanyCandidate, IkigaiIscoCandidate } from "./types";

export const IKIGAI_TARGET_PRE_LLM_POOL_SIZE = 100;

export function getDefaultIkigaiAxisMinimums(): AxisMinimums {
  return { ...DEFAULT_AXIS_MINIMUMS };
}

export function matchesIkigaiAxisMinimums(company: Company, axisMinimums: AxisMinimums): boolean {
  return AXIS_IDS.every((axis) => matchesAxisMinimum(company, axis, axisMinimums[axis] ?? "none"));
}

export function applyIkigaiAxisMinimums(
  candidates: IkigaiCompanyCandidate[],
  axisMinimums: AxisMinimums
): IkigaiCompanyCandidate[] {
  return candidates.filter((candidate) => matchesIkigaiAxisMinimums(candidate.company, axisMinimums));
}

export function getIkigaiAxisFilteredCount(
  candidates: IkigaiCompanyCandidate[],
  axisMinimums: AxisMinimums
): number {
  return applyIkigaiAxisMinimums(candidates, axisMinimums).length;
}

export function shouldTightenIkigaiAxisFilters(candidateCount: number): boolean {
  return candidateCount > IKIGAI_TARGET_PRE_LLM_POOL_SIZE;
}

export function preserveIkigaiIscoCandidatesOnAxisChange(
  iscoCandidates: IkigaiIscoCandidate[]
): IkigaiIscoCandidate[] {
  return iscoCandidates.map((candidate) => ({ ...candidate }));
}
