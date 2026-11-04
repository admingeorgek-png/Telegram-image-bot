// Basic prompt safety filter. This is a first line of defense only.
// Keyword filters can be bypassed, so the providers' own safe modes stay on too.

const BLOCKED = [
  /\b(nude|nudes|naked|nsfw|porn|porno|pornographic|sex|sexual|erotic|hentai|topless|nipples?|genitals?|boobs?|fetish|xxx|blowjob|orgasm|masturbat\w*|lingerie)\b/i,
  /\b(gore|gory|dismember\w*|decapitat\w*|mutilat\w*|beheading|bloodbath)\b/i,
  /\b(swastika|nazi)\b/i,
  /\b(child abuse|rape|raping)\b/i,
];

const MINOR = /\b(child|children|kid|kids|boy|girl|minor|underage|teen|teens|teenager|toddler|baby|loli|shota|schoolgirl|schoolboy|preteen)\b/i;
const SUGGESTIVE = /\b(sexy|seductive|bikini|swimsuit|underwear|panties|bra|undress\w*|cleavage|thong|provocative|revealing|sensual|flirty)\b/i;

// Photo edits are stricter: nobody should be undressed or sexualized in an edited photo,
// whatever the age, because the bot cannot see who is in the picture.
const EDIT_BLOCKED =
  /\b(undress\w*|take\s+off|remove\s+(?:her|his|their|the|my)?\s*(?:clothes|clothing|shirt|top|dress|pants|bra|underwear)|see[- ]through|transparent\s+(?:clothes|clothing|dress)|bikini|swimsuit|swimwear|underwear|panties|bra|cleavage|breasts?|sexy|seductive|sensual|topless|strip(?:ped|ping)?\s+(?:her|his|their|him|them|off|naked|down))\b/i;

function checkPrompt(text) {
  const t = String(text || "");
  for (const re of BLOCKED) {
    if (re.test(t)) return { ok: false };
  }
  if (MINOR.test(t) && SUGGESTIVE.test(t)) return { ok: false };
  return { ok: true };
}

function checkEditInstruction(text) {
  const t = String(text || "");
  if (!checkPrompt(t).ok) return { ok: false };
  if (EDIT_BLOCKED.test(t)) return { ok: false };
  return { ok: true };
}

module.exports = { checkPrompt, checkEditInstruction };
