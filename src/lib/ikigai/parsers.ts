import type { IkigaiIscoCandidate, IkigaiIscoStrength, IkigaiSelectedMatch } from "./types";

function extractJsonContent(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseJson(content: string): unknown {
  return JSON.parse(extractJsonContent(content));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStrength(value: unknown): IkigaiIscoStrength | null {
  return value === "strong" || value === "weak" ? value : null;
}

export function parseIkigaiIscoCandidates(content: string): IkigaiIscoCandidate[] | null {
  let parsed: unknown;

  try {
    parsed = parseJson(content);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.candidates)) return null;

  const candidates: IkigaiIscoCandidate[] = [];
  for (const item of parsed.candidates) {
    if (!isRecord(item)) return null;

    const rawCode = item.isco_code ?? item.iscoCode ?? item.code;
    const strength = normalizeStrength(item.strength);
    const reason = typeof item.reason === "string" ? item.reason.trim() : "";

    if (typeof rawCode !== "string" || !/^\d{3}$/.test(rawCode) || !strength || reason.length === 0) {
      return null;
    }

    candidates.push({ iscoCode: rawCode, strength, reason });
  }

  return candidates;
}

export function parsePass1CandidateIds(content: string, allowedCompanyIds: Iterable<string>): string[] | null {
  let parsed: unknown;

  try {
    parsed = parseJson(content);
  } catch {
    return null;
  }

  const ids = isRecord(parsed) ? parsed.candidate_company_ids ?? parsed.candidateCompanyIds ?? parsed.company_ids : null;
  if (!Array.isArray(ids)) return null;

  const allowed = new Set(allowedCompanyIds);
  const seen = new Set<string>();
  const validIds: string[] = [];

  for (const id of ids) {
    if (typeof id !== "string" || !allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    validIds.push(id);
  }

  return validIds;
}

export function parsePass2SelectedMatches(
  content: string,
  allowedCompanyIds: Iterable<string>
): IkigaiSelectedMatch[] | null {
  let parsed: unknown;

  try {
    parsed = parseJson(content);
  } catch {
    return null;
  }

  const matches = isRecord(parsed) ? parsed.selected_matches ?? parsed.selectedMatches ?? parsed.matches : null;
  if (!Array.isArray(matches)) return null;

  const allowed = new Set(allowedCompanyIds);
  const seen = new Set<string>();
  const selected: IkigaiSelectedMatch[] = [];

  for (const item of matches) {
    if (!isRecord(item)) return null;

    const rawId = item.company_id ?? item.companyId ?? item.id;
    const reason = typeof item.reason === "string" ? item.reason.trim() : "";
    if (typeof rawId !== "string" || !allowed.has(rawId) || seen.has(rawId) || reason.length === 0) continue;

    seen.add(rawId);
    selected.push({ companyId: rawId, reason });
  }

  return selected;
}
