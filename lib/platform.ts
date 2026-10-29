// Nome da plataforma a partir do link que o escritório indica para receber ficheiros.
// Ex.: https://drive.google.com/... -> "Google Drive"; https://portal.silva.pt/upload -> "portal.silva.pt"
const KNOWN: [RegExp, string][] = [
  [/(^|\.)docs\.google\.com$/, "Google Drive"],
  [/(^|\.)drive\.google\.com$/, "Google Drive"],
  [/(^|\.)forms\.gle$/, "Google Forms"],
  [/(^|\.)dropbox\.com$|(^|\.)db\.tt$/, "Dropbox"],
  [/(^|\.)onedrive\.live\.com$|(^|\.)1drv\.ms$|(^|\.)sharepoint\.com$/, "OneDrive"],
  [/(^|\.)wetransfer\.com$|(^|\.)we\.tl$/, "WeTransfer"],
  [/(^|\.)box\.com$/, "Box"],
  [/(^|\.)icloud\.com$/, "iCloud Drive"],
  [/(^|\.)mega\.(nz|io)$/, "MEGA"],
  [/(^|\.)fromsmash\.com$/, "Smash"],
  [/(^|\.)taxdome\.com$/, "TaxDome"],
  [/(^|\.)jotform\.com$/, "Jotform"],
  [/(^|\.)typeform\.com$/, "Typeform"],
  [/(^|\.)tally\.so$/, "Tally"],
  [/(^|\.)toconline\.(pt|com)$/, "TOConline"],
];

export function platformName(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "docs.google.com" && u.pathname.startsWith("/forms")) return "Google Forms";
  for (const [re, name] of KNOWN) if (re.test(host)) return name;
  return host || null;
}
