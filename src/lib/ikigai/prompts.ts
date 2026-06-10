import type { IkigaiAllowedIscoCode, IkigaiAnswers, IkigaiLocale } from "./types";
import type { IkigaiCompactCompanyProfile, IkigaiFullCompanyProfile } from "./profiles";

export function buildIscoDerivationPrompt(
  answers: IkigaiAnswers,
  allowedCodes: IkigaiAllowedIscoCode[],
  locale: IkigaiLocale
): string {
  const codes = allowedCodes.map((code) => ({
    code: code.code,
    label: code.label,
    domains: code.domains,
    company_count: code.companyCount,
  }));

  return JSON.stringify(
    {
      task:
        "map the user's work and strengths to matching isco-08 minor codes from the allowed list only",
      locale,
      output_shape: {
        candidates: [
          {
            isco_code: "three digit code from allowed_codes",
            strength: "strong or weak",
            reason: "short reason grounded in the user answers",
          },
        ],
      },
      user_answers: {
        current_work: answers.currentWork,
        strengths: answers.strengths,
        cares_about: answers.caresAbout,
        work_context: answers.workContext,
      },
      allowed_codes: codes,
      rules: [
        "return only valid json",
        "use only codes from allowed_codes",
        "choose strong when the user's stated skills directly match the occupation family",
        "choose weak when the match is plausible but indirect",
      ],
    },
    null,
    2
  );
}

export function buildPass1MatchingPrompt(
  answers: IkigaiAnswers,
  profiles: IkigaiCompactCompanyProfile[],
  locale: IkigaiLocale,
  refinement?: string | null
): string {
  return JSON.stringify(
    {
      task: "choose the best ikigai company candidates from compact company descriptions",
      locale,
      output_shape: {
        candidate_company_ids: ["company id from supplied companies"],
      },
      user_answers: answers,
      refinement: refinement?.trim() || null,
      companies: profiles,
      rules: [
        "return only valid json",
        "use only company ids from companies",
        "prefer grounded fit over popularity",
        "return about 25 ids, or fewer when fewer companies are supplied",
      ],
    },
    null,
    2
  );
}

export function buildPass2MatchingPrompt(
  answers: IkigaiAnswers,
  profiles: IkigaiFullCompanyProfile[],
  locale: IkigaiLocale,
  refinement?: string | null
): string {
  return JSON.stringify(
    {
      task: "choose the strongest final ikigai matches from full company profiles",
      locale,
      output_shape: {
        selected_matches: [
          {
            company_id: "company id from supplied companies",
            reason: "short reasoning grounded only in supplied profile fields",
          },
        ],
      },
      user_answers: answers,
      refinement: refinement?.trim() || null,
      companies: profiles,
      rules: [
        "return only valid json",
        "use only company ids from companies",
        "choose 3 to 10 matches when enough companies are supplied",
        "ground every reason in supplied company fields and user answers",
      ],
    },
    null,
    2
  );
}
