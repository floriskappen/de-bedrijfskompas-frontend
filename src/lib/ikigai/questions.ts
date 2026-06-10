import type {
  IkigaiAnswerDraft,
  IkigaiAnswers,
  IkigaiQuestion,
  IkigaiQuestionId,
  IkigaiValidationResult,
} from "./types";
import { IKIGAI_QUESTION_IDS } from "./types";

// The four steps map onto the ikigai circles: what you love, what you are good
// at, what the world needs, and where you fit. The first two feed occupational
// (ISCO) derivation; the last two steer axis preferences and the grounded final
// judging. Keep the prompts plain and personal, the examples concrete.
export const IKIGAI_QUESTIONS: IkigaiQuestion[] = [
  {
    id: "currentWork",
    required: true,
    eyebrow: {
      nl: "wat je liefhebt",
      en: "what you love",
    },
    label: {
      nl: "wat voor werk geeft je energie?",
      en: "what kind of work gives you energy?",
    },
    helper: {
      nl: "het soort werk waar je de tijd bij vergeet, niet je functietitel.",
      en: "the kind of work you lose track of time in, not your job title.",
    },
    placeholder: {
      nl: "ik werk graag aan…",
      en: "i like working on…",
    },
    examples: {
      nl: ["onderzoek", "iets maken met je handen", "lesgeven", "software", "zorg", "ontwerpen"],
      en: ["research", "making things by hand", "teaching", "software", "care", "designing"],
    },
  },
  {
    id: "strengths",
    required: true,
    eyebrow: {
      nl: "waar je goed in bent",
      en: "what you are good at",
    },
    label: {
      nl: "waar ben je goed in?",
      en: "what are you good at?",
    },
    helper: {
      nl: "de vaardigheden waar mensen op je terugvallen.",
      en: "the skills people lean on you for.",
    },
    placeholder: {
      nl: "ik kan goed…",
      en: "i'm good at…",
    },
    examples: {
      nl: ["analyseren", "uitleggen", "organiseren", "bouwen", "schrijven", "doorzetten"],
      en: ["analysing", "explaining", "organising", "building", "writing", "persevering"],
    },
  },
  {
    id: "caresAbout",
    required: true,
    eyebrow: {
      nl: "wat de wereld nodig heeft",
      en: "what the world needs",
    },
    label: {
      nl: "waar wil je dat je werk aan bijdraagt?",
      en: "what do you want your work to contribute to?",
    },
    helper: {
      nl: "het verschil dat je hoopt te maken, voorbij het salaris.",
      en: "the difference you hope to make, beyond the paycheck.",
    },
    placeholder: {
      nl: "ik wil bijdragen aan…",
      en: "i want to contribute to…",
    },
    examples: {
      nl: ["natuur", "gezondheid", "rechtvaardigheid", "vakmanschap", "gemeenschap", "rust"],
      en: ["nature", "health", "fairness", "craft", "community", "calm"],
    },
  },
  {
    id: "workContext",
    required: true,
    eyebrow: {
      nl: "waar je past",
      en: "where you fit",
    },
    label: {
      nl: "in wat voor omgeving kom je tot je recht?",
      en: "what kind of setting brings out your best?",
    },
    helper: {
      nl: "de schaal en sfeer waarin je je thuis voelt.",
      en: "the scale and feel where you're at home.",
    },
    placeholder: {
      nl: "ik werk het best in…",
      en: "i work best in…",
    },
    examples: {
      nl: ["een klein team", "veel autonomie", "duidelijke structuur", "praktisch werk", "dichtbij huis"],
      en: ["a small team", "lots of autonomy", "clear structure", "hands-on work", "close to home"],
    },
  },
];

export function normalizeIkigaiAnswer(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateIkigaiAnswers(answers: IkigaiAnswerDraft): IkigaiValidationResult {
  const missing = IKIGAI_QUESTIONS.filter((question) => question.required)
    .filter((question) => normalizeIkigaiAnswer(answers[question.id]).length === 0)
    .map((question) => question.id);

  return { ok: missing.length === 0, missing };
}

export function toIkigaiAnswers(answers: IkigaiAnswerDraft): IkigaiAnswers | null {
  if (!validateIkigaiAnswers(answers).ok) return null;

  return IKIGAI_QUESTION_IDS.reduce((normalized, id) => {
    normalized[id] = normalizeIkigaiAnswer(answers[id]);
    return normalized;
  }, {} as IkigaiAnswers);
}

export function getIkigaiQuestion(id: IkigaiQuestionId): IkigaiQuestion {
  return IKIGAI_QUESTIONS.find((question) => question.id === id) ?? IKIGAI_QUESTIONS[0];
}
