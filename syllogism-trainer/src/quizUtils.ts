import { wordBankA, wordBankB, wordBankC, dataset } from "./syllogismData";

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to determine if the sentence should use singular or plural
function needsSingular(text: string) {
  // Use singular for "If something is a/an A", "At least one A is", etc.
  return /\bIf something is (a|an) (A|B|C)\b|\bAt least one (A|B|C) is\b/i.test(
    text,
  );
}

function needsPlural(text: string) {
  // Use plural for "No A are B", "All A are B", "Some A are B", etc.
  return /\bNo (A|B|C) are\b|\bAll (A|B|C) are\b|\bSome (A|B|C) are\b/i.test(
    text,
  );
}

// Helper for "either/or" and "both/and" logic
function needsEitherOrSingular(text: string) {
  // e.g. "A must be either B or C", "A cannot be both B and C", "A cannot be neither B nor C"
  return /\bmust be either\b|\bcannot be both\b|\bcannot be neither\b/i.test(
    text,
  );
}

// Capitalise the first letter of the string
function capitaliseFirst(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function getArticle(word: string) {
  // Use "an" for vowel sounds, "a" otherwise
  // Exception: words starting with consonant-sounding vowels use "a" (u in utensil, eu in european)
  const consonantSoundVowels = /^(u|eu)/i.test(word);
  if (consonantSoundVowels) return "a";
  // Exception: silent h words use "an" (hour, honor, heir, honest, etc.)
  const silentH =
    /^h[aeiou]/i.test(word) && /^(hour|honor|heir|honest|herb)/i.test(word);
  if (silentH) return "an";
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function replaceABC(text: string, A: any, B: any, C: any) {
  let replaced = text;

  // Replace "a/an A", "a/an B", "a/an C" with correct article and singular
  replaced = replaced.replace(
    /\b(a|an) A\b/gi,
    () => `${getArticle(A.singular)} ${A.singular}`,
  );
  replaced = replaced.replace(
    /\b(a|an) B\b/gi,
    () => `${getArticle(B.singular)} ${B.singular}`,
  );
  replaced = replaced.replace(
    /\b(a|an) C\b/gi,
    () => `${getArticle(C.singular)} ${C.singular}`,
  );

  // Special handling for "either/or" and "neither/nor" logic
  if (needsEitherOrSingular(text)) {
    // "A must be either B or C" => "Trees must be either a utensil or a mountain"
    // "A cannot be both B and C" => "Trees cannot be both a utensil and a mountain"
    replaced = replaced.replace(/\bA\b/g, A.plural);

    // Replace "either B or C" and "neither B nor C" with articles for both
    replaced = replaced.replace(
      /\beither B or C\b/gi,
      `either ${getArticle(B.singular)} ${B.singular} or ${getArticle(C.singular)} ${C.singular}`,
    );
    replaced = replaced.replace(
      /\bneither B nor C\b/gi,
      `neither ${getArticle(B.singular)} ${B.singular} nor ${getArticle(C.singular)} ${C.singular}`,
    );
    replaced = replaced.replace(
      /\bboth B and C\b/gi,
      `both ${getArticle(B.singular)} ${B.singular} and ${getArticle(C.singular)} ${C.singular}`,
    );
    // If just "B and C" or "B or C" or "B nor C" (fallback)
    replaced = replaced.replace(
      /\bB (and|or|nor) C\b/gi,
      (_m, conj) =>
        `${getArticle(B.singular)} ${B.singular} ${conj} ${getArticle(C.singular)} ${C.singular}`,
    );
    // Remove double articles if present (e.g., "a a chair")
    replaced = replaced.replace(/\b(a|an) (a|an) /gi, (m, a1, a2) => a1 + " ");
  } else if (needsPlural(text)) {
    replaced = replaced.replace(/\bA\b/g, A.plural);
    replaced = replaced.replace(/\bB\b/g, B.plural);
    replaced = replaced.replace(/\bC\b/g, C.plural);
  } else if (needsSingular(text)) {
    replaced = replaced.replace(/\bA\b/g, A.singular);
    replaced = replaced.replace(/\bB\b/g, B.singular);
    replaced = replaced.replace(/\bC\b/g, C.singular);
  } else {
    // Default: use singular
    replaced = replaced.replace(/\bA\b/g, A.singular);
    replaced = replaced.replace(/\bB\b/g, B.singular);
    replaced = replaced.replace(/\bC\b/g, C.singular);
  }

  // Remove article for plural forms (e.g., "a steps" -> "steps")
  replaced = replaced.replace(/\b(a|an) ([a-z]+s)\b/gi, (_, __, word) => word);

  // Fix "a/an" before words like "utensil" (should be "a utensil", not "an utensil")
  replaced = replaced.replace(
    /\b(an|a) ([a-z]+)/gi,
    (_, art, word) => `${getArticle(word)} ${word}`,
  );

  return capitaliseFirst(replaced.trim());
}

export function getRandomQuiz() {
  const premiseObj = getRandom(dataset);
  const questionObj = getRandom(premiseObj.questions);
  const A = getRandom(wordBankA);
  const B = getRandom(wordBankB);
  const C = getRandom(wordBankC);

  return {
    premise: replaceABC(premiseObj.premise, A, B, C),
    question: replaceABC(questionObj.text, A, B, C),
    correct: questionObj.correct,
    explanation: questionObj.explanation
      ? replaceABC(questionObj.explanation, A, B, C)
      : undefined,
    keyTakeaway: questionObj.keyTakeaway ? questionObj.keyTakeaway : undefined,
  };
}
