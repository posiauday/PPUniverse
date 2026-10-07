/**
 * Comments on guides (MVP-040; docs/final-decisions.md, 2026-10-07, "Top bar
 * names, AI search readiness, and comments"):
 * - signed-in readers only; a comment shows at once, and an admin removes it
 *   after reports;
 * - plain text, with code in ``` fences; at most COMMENT_MAX_LINKS links,
 *   which are shown with rel="ugc nofollow" (Google's advice for user content);
 * - shown under the reader's display name and generated avatar, never their
 *   email or the name their sign-in provider gave.
 */

export const COMMENT_MIN_LENGTH = 10;
export const COMMENT_MAX_LENGTH = 2000;
export const COMMENT_MAX_LINKS = 2;

export type CommentProblem = "too-short" | "too-long" | "too-many-links";

const URL_PATTERN = /\bhttps?:\/\/[^\s<>()]+/gi;

/** Every http(s) address in a comment, in order. */
export function commentLinks(text: string): string[] {
  return text.match(URL_PATTERN) ?? [];
}

/**
 * A comment's text, with line endings tidied and outer blank lines trimmed
 * (indentation inside is kept, for code), or why it was refused. Counted in
 * code points, so an emoji is one character.
 */
export function cleanCommentBody(
  raw: string,
): { ok: true; body: string } | { ok: false; problem: CommentProblem } {
  const body = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "");
  if ([...body.trim()].length < COMMENT_MIN_LENGTH) return { ok: false, problem: "too-short" };
  if ([...body].length > COMMENT_MAX_LENGTH) return { ok: false, problem: "too-long" };
  if (commentLinks(body).length > COMMENT_MAX_LINKS) {
    return { ok: false, problem: "too-many-links" };
  }
  return { ok: true, body };
}

/** A comment split into plain paragraphs and ``` code blocks, for rendering as text. */
export type CommentPart = { kind: "text"; text: string } | { kind: "code"; text: string };

export function commentParts(body: string): CommentPart[] {
  const parts: CommentPart[] = [];
  const pieces = body.split(/^```[^\n]*$/m);
  pieces.forEach((piece, index) => {
    // Odd pieces sit between two fences; an unclosed fence stays plain text.
    const inCode = index % 2 === 1 && index < pieces.length - 1;
    if (inCode) {
      const code = piece.replace(/^\n|\n$/g, "");
      if (code) parts.push({ kind: "code", text: code });
      return;
    }
    for (const paragraph of piece.split(/\n{2,}/)) {
      const text = paragraph.trim();
      if (text) parts.push({ kind: "text", text });
    }
  });
  return parts;
}

// ---- Display names and avatars ------------------------------------------

/** Words for generated names: everyday Power Platform terms, no product names. */
const NAME_ADJECTIVES = [
  "Swift",
  "Tidy",
  "Bright",
  "Steady",
  "Clever",
  "Quiet",
  "Bold",
  "Calm",
  "Keen",
  "Nimble",
  "Lucky",
  "Sunny",
  "Brave",
  "Gentle",
  "Rapid",
  "Patient",
] as const;
const NAME_NOUNS = [
  "Trigger",
  "Canvas",
  "Connector",
  "Formula",
  "Lookup",
  "Gallery",
  "Flow",
  "Schema",
  "Column",
  "Measure",
  "Topic",
  "Agent",
  "Solution",
  "Scope",
  "Record",
  "Filter",
] as const;

/** A random name such as "Tidy Trigger 418". `random` returns a number in [0, 1). */
export function generateDisplayName(random: () => number): string {
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!;
  const adjective = pick(NAME_ADJECTIVES);
  const noun = pick(NAME_NOUNS);
  return `${adjective} ${noun} ${100 + Math.floor(random() * 900)}`;
}

export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 30;

/** Names that would look official, or like someone else. */
const RESERVED = [
  "admin",
  "moderator",
  "staff",
  "support",
  "official",
  "lowcodestacks",
  "makerdesk",
  "microsoft",
];

export type DisplayNameProblem = "too-short" | "too-long" | "characters" | "reserved";

/** The key that keeps names unique in any case, with repeated spaces ignored. */
export function displayNameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * A display name the reader typed: letters (any language), digits, spaces
 * and . _ - only, with at least one letter, 3 to 30 characters.
 */
export function cleanDisplayName(
  raw: string,
): { ok: true; name: string } | { ok: false; problem: DisplayNameProblem } {
  const name = raw.normalize("NFC").trim().replace(/\s+/g, " ");
  const length = [...name].length;
  if (length < DISPLAY_NAME_MIN_LENGTH) return { ok: false, problem: "too-short" };
  if (length > DISPLAY_NAME_MAX_LENGTH) return { ok: false, problem: "too-long" };
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name) || !/\p{L}/u.test(name)) {
    return { ok: false, problem: "characters" };
  }
  const squashed = name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  if (RESERVED.some((word) => squashed.includes(word))) return { ok: false, problem: "reserved" };
  return { ok: true, name };
}

/** The avatar a seed draws: one of our area tints and one of our own shapes. */
export const AVATAR_TINTS = [
  "apps",
  "automate",
  "bi",
  "copilot",
  "dataverse",
  "pages",
  "gov",
] as const;
export const AVATAR_SHAPES = ["stack", "spark", "loop", "grid", "wave", "node"] as const;

export interface AvatarSpec {
  tint: (typeof AVATAR_TINTS)[number];
  shape: (typeof AVATAR_SHAPES)[number];
}

/** Deterministic: the same seed always draws the same avatar (FNV-1a hash). */
export function avatarFromSeed(seed: string): AvatarSpec {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return {
    tint: AVATAR_TINTS[hash % AVATAR_TINTS.length]!,
    shape: AVATAR_SHAPES[Math.floor(hash / AVATAR_TINTS.length) % AVATAR_SHAPES.length]!,
  };
}

// ---- Data shapes --------------------------------------------------------

export interface PublicProfile {
  displayName: string;
  avatarSeed: string;
}

export interface GuideComment extends PublicProfile {
  id: string;
  body: string;
  createdAt: Date;
  accepted: boolean;
  /** True when the signed-in reader wrote it, so they may delete it. */
  mine: boolean;
}

export interface AdminComment extends PublicProfile {
  id: string;
  articleSlug: string;
  articleTitle: string;
  body: string;
  createdAt: Date;
  removed: boolean;
  accepted: boolean;
  reportCount: number;
}

export interface CommentRepository {
  /** The reader's profile, given a random name and avatar the first time. */
  getOrCreateProfile(userId: string, random: () => number): Promise<PublicProfile>;
  /** False when another reader already has that name, in any case. */
  setDisplayName(userId: string, name: string): Promise<boolean>;
  setAvatarSeed(userId: string, seed: string): Promise<void>;
  /** A guide's comments that aren't removed: the accepted one first, then oldest first. */
  listVisible(articleId: string, viewerId: string | null): Promise<GuideComment[]>;
  create(articleId: string, userId: string, body: string): Promise<{ id: string }>;
  /** Deletes the reader's own comment; false if it isn't theirs. */
  deleteOwn(commentId: string, userId: string): Promise<boolean>;
  /** Records a report; false when the comment doesn't exist or is removed. */
  report(commentId: string): Promise<boolean>;
  listForAdmin(filter: "reported" | "latest", limit: number): Promise<AdminComment[]>;
  setRemoved(commentId: string, removed: boolean): Promise<boolean>;
  /** Marks a comment as its guide's accepted fix (clearing any other), or unmarks it. */
  setAccepted(commentId: string, accepted: boolean): Promise<boolean>;
}
