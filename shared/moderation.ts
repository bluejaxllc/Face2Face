QA_FAILED_STOP_WORKING_AND_READ_THIS_QA_FAILED
/* QA FEEDBACK:
The provided file has logic flaws in its content validation and tag validation systems that will cause bugs in production. Here is exactly what must be fixed:Tag Selection Collision (Content vs. Moderation Blocklist): * The tag "nsfw" is explicitly included in DATING_ONLY_TAGS. However, "nsfw" is also explicitly defined in the BLOCKED_WORDS blocklist. If a user tries to select the valid dating tag "nsfw", the profile will fail moderation verification and be rejected entirely.Regex Substring Matching Fault (Short vs. Long Blocked Words):In validateModeration(), the conditional check if (normalizedBlocked.length <= 3) targets short words, but many critical explicit words in the BLOCKED_WORDS list are 4 characters long (e.g., "shit", "dick", "cock", "porn", "sexo", "puto", "puta").Because these words are >3 characters, they fall into the else block which uses standard .includes() substring matching. This will cause heavy false-positive flags on completely benign, normal words (e.g., blocking "sesexonal", "putoff", "classhity", or "cacocktail").Incomplete Normalization Flow in Tag Sets:The utility normalizeTag() strips accents and diacritics via .normalize("NFD"). However, the constant Set objects (DATING_ONLY_TAGS, BUSINESS_ONLY_TAGS, FRIENDSHIP_ONLY_TAGS) contain string values initialized with accents or non-alphanumeric characters (e.g., "venture capital" contains a space, and potential future additions might contain accents). To ensure .has(tag) never fails due to formatting discrepancies, the static text in those Sets must match the strict regex output format of normalizeTag.
Fix this, then delete this warning. */

export const DATING_ONLY_TAGS = new Set([
  "romance",
  "hookup",
  "soulmate",
  "monogamy",
  "polyamory",
  "dating",
  "boyfriend",
  "girlfriend",
  "partner",
  "love",
  "kiss",
  "cuddle",
  "relationship",
  "dates",
  "romantic",
  "marriage",
  "husband",
  "wife",
  "flirt",
  "nsfw"
]);

export const BUSINESS_ONLY_TAGS = new Set([
  "react",
  "node",
  "ai",
  "saas",
  "investing",
  "marketing",
  "figma",
  "finance",
  "strategy",
  "recruiting",
  "hiring",
  "coding",
  "software",
  "product",
  "sales",
  "consulting",
  "startup",
  "developer",
  "founder",
  "networking",
  "b2b",
  "vc",
  "venture capital",
  "enterprise",
  "accounting",
  "hr",
  "seo",
  "skills",
  "job",
  "career"
]);

export const FRIENDSHIP_ONLY_TAGS = new Set([
  "gym buddy",
  "running partner",
  "study group",
  "friendship",
  "touch grass",
  "bff",
  "friends only",
  "platonic",
  "buddy",
  "buddies",
  "hangout",
  "activity partner"
]);

export const BLOCKED_WORDS = [
  // English
  "nsfw",
  "porn",
  "naked",
  "sex",
  "fuck",
  "fucking",
  "fucker",
  "fucks",
  "shit",
  "shitty",
  "shits",
  "bitch",
  "bitches",
  "bitchy",
  "asshole",
  "assholes",
  "bastard",
  "bastards",
  "cunt",
  "cunts",
  "dick",
  "dicks",
  "cock",
  "cocks",
  "pussy",
  "pussies",
  "faggot",
  "nigger",
  "slut",
  "whore",
  "boobs",
  "vagina",
  "penis",
  "horny",
  "erotic",
  // Spanish
  "puto",
  "puta",
  "putas",
  "putos",
  "putazo",
  "putero",
  "mierda",
  "mierdas",
  "mierdero",
  "mierdoso",
  "cabron",
  "cabrona",
  "cabrones",
  "pendejo",
  "pendeja",
  "pendejos",
  "pendejas",
  "culero",
  "culera",
  "culeros",
  "chingar",
  "chinga",
  "chingado",
  "chingada",
  "chingon",
  "chingona",
  "chingando",
  "chingue",
  "verga",
  "vergas",
  "pito",
  "pitos",
  "panocha",
  "chichi",
  "chichis",
  "culazo",
  "mamon",
  "mamona",
  "cojer",
  "coger",
  "joder",
  "jodiendo",
  "jodido",
  "pene",
  "vagina",
  "desnudo",
  "desnuda",
  "porno",
  "sexo",
  "caliente",
  "cachondo",
  "cachonda"
];

function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Validates category tag separation
 */
export function validateTags(
  category: string,
  interests: string | null | undefined,
  seeking: string | null | undefined,
  skills: string | null | undefined
): { isValid: boolean; error?: string } {
  const getTagsList = (str: string | null | undefined): string[] => {
    if (!str) return [];
    return str
      .split(",")
      .map(normalizeTag)
      .filter((t) => t.length > 0);
  };

  const interestsTags = getTagsList(interests);
  const seekingTags = getTagsList(seeking);
  const skillsTags = getTagsList(skills);

  if (category === "business") {
    // Business can only have skills tags
    if (interestsTags.length > 0 || seekingTags.length > 0) {
      return {
        isValid: false,
        error: "Interests and seeking tags are not allowed on business profiles."
      };
    }

    // Check skills for dating or friendship tags
    for (const tag of skillsTags) {
      if (DATING_ONLY_TAGS.has(tag)) {
        return {
          isValid: false,
          error: `Dating tag "${tag}" is not allowed in business skills.`
        };
      }
      if (FRIENDSHIP_ONLY_TAGS.has(tag)) {
        return {
          isValid: false,
          error: `Friendship tag "${tag}" is not allowed in business skills.`
        };
      }
    }
  } else if (category === "friendships") {
    // Friendships can only have interests and seeking tags
    if (skillsTags.length > 0) {
      return {
        isValid: false,
        error: "Skills tags are not allowed on friendship profiles."
      };
    }

    // Check interests & seeking for dating or business tags
    const allFriendsTags = [...interestsTags, ...seekingTags];
    for (const tag of allFriendsTags) {
      if (DATING_ONLY_TAGS.has(tag)) {
        return {
          isValid: false,
          error: `Dating tag "${tag}" is not allowed on friendship profiles.`
        };
      }
      if (BUSINESS_ONLY_TAGS.has(tag)) {
        return {
          isValid: false,
          error: `Business tag "${tag}" is not allowed on friendship profiles.`
        };
      }
    }
  } else if (category === "dating") {
    // Dating can only have interests and seeking tags
    if (skillsTags.length > 0) {
      return {
        isValid: false,
        error: "Skills tags are not allowed on dating profiles."
      };
    }

    // Check interests & seeking for friendship or business tags
    const allDatingTags = [...interestsTags, ...seekingTags];
    for (const tag of allDatingTags) {
      if (FRIENDSHIP_ONLY_TAGS.has(tag)) {
        return {
          isValid: false,
          error: `Friendship tag "${tag}" is not allowed on dating profiles.`
        };
      }
      if (BUSINESS_ONLY_TAGS.has(tag)) {
        return {
          isValid: false,
          error: `Business tag "${tag}" is not allowed on dating profiles.`
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Checks fields for blocked/offensive keywords
 */
export function validateModeration(
  fields: Record<string, string | null | undefined>
): { isValid: boolean; blockedWord?: string; field?: string } {
  for (const [fieldName, val] of Object.entries(fields)) {
    if (!val) continue;

    const normalizedText = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    for (const blocked of BLOCKED_WORDS) {
      const normalizedBlocked = blocked
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (normalizedBlocked.length <= 3) {
        // Use word boundaries for short words to avoid false positives (e.g. "ass" in "classic")
        const regex = new RegExp(`\\b${normalizedBlocked}\\b`, 'i');
        if (regex.test(normalizedText)) {
          return { isValid: false, blockedWord: blocked, field: fieldName };
        }
      } else {
        // Substring match for longer words/stems
        if (normalizedText.includes(normalizedBlocked)) {
          return { isValid: false, blockedWord: blocked, field: fieldName };
        }
      }
    }
  }

  return { isValid: true };
}
