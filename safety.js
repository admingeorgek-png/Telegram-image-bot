// Basic prompt safety filter. This is a first line of defense only.
// Keyword filters can be bypassed, so keep the provider's own safe mode on too.

const BLOCKED = [
  /\b(nude|nudes|naked|nsfw|porn|porno|pornographic|sex|sexual|sexy nude|erotic|hentai|topless|nipples?|genitals?|boobs?|breasts?|fetish|xxx|blowjob|orgasm|masturbat\w*|lingerie)\b/i,
  /\b(gore|gory|dismember\w*|decapitat\w*|mutilat\w*|beheading|torture|bloodbath)\b/i,
  /\b(swastika|nazi)\b/i,
  /\b(child abuse|rape|raping)\b/i,
];

const MINOR = /\b(child|children|kid|kids|boy|girl|minor|underage|teen|teens|teenager|toddler|baby|loli|shota|schoolgirl|schoolboy|preteen)\b/i;
const SUGGESTIVE = /\b(sexy|seductive|bikini|swimsuit|underwear|panties|bra|undress\w*|cleavage|thong|provocative|revealing|sensual|flirty)\b/i;

function checkPrompt(text) {
  const t = String(text || "");
  for (const re of BLOCKED) {
    if (re.test(t)) return { ok: false };
  }
  if (MINOR.test(t) && SUGGESTIVE.test(t)) return { ok: false };
  return { ok: true };
}

module.exports = { checkPrompt };
