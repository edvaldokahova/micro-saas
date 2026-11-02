import "server-only";
// Domínio próprio do escritório (plano Escritório) para as páginas dos clientes, ex.: docs.gabinete.pt.
// O Bilonai junta o domínio ao projeto na Vercel pela API; o escritório só cria um registo CNAME no DNS.
// Precisa de VERCEL_API_TOKEN (criado na conta Vercel), VERCEL_PROJECT_ID e VERCEL_TEAM_ID.
import { site } from "@/lib/site";

const API = "https://api.vercel.com";
export const CNAME_TARGET = "cname.vercel-dns.com";

// Domínios nossos (nunca podem ser usados como domínio de escritório)
const OURS = ["bilonai.com", "vercel.app", "vercel.com", "localhost"];

export function domainsReady(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);
}

// Aceita só subdomínios (docs.gabinete.pt), em minúsculas, sem http nem caminho
export function normalizeDomain(raw: string): string | null {
  const d = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
  if (d.length > 200) return null;
  if (!/^(?=.{4,200}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){2,}[a-z]{2,24}$/.test(d)) return null;
  if (OURS.some((o) => d === o || d.endsWith(`.${o}`))) return null;
  return d;
}

// O nome a pôr no registo CNAME: a parte antes do domínio principal (docs.gabinete.pt -> docs).
// Para domínios como .com.br ou .co.uk, o nome tem uma parte a menos do que parece; mostramos o nome completo como alternativa.
export function cnameHost(domain: string): string {
  const parts = domain.split(".");
  const twoLevel = /\.(com|net|org|gov|edu|co)\.[a-z]{2}$/.test(domain);
  return parts.slice(0, parts.length - (twoLevel ? 3 : 2)).join(".") || "@";
}

async function vercel(path: string, init?: RequestInit) {
  const team = process.env.VERCEL_TEAM_ID ? `${path.includes("?") ? "&" : "?"}teamId=${process.env.VERCEL_TEAM_ID}` : "";
  const res = await fetch(`${API}${path}${team}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: body as Record<string, unknown> };
}

const project = () => process.env.VERCEL_PROJECT_ID!;

export type DomainCheck = {
  active: boolean;
  // Quando o domínio já esteve noutra conta Vercel, a Vercel pede também um registo TXT
  txt: { name: string; value: string } | null;
};

export async function addDomain(domain: string): Promise<{ ok: boolean; taken?: boolean }> {
  const r = await vercel(`/v10/projects/${project()}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) });
  if (r.ok) return { ok: true };
  const code = (r.body.error as { code?: string } | undefined)?.code;
  // Já está neste projeto (ex.: o escritório guardou duas vezes)
  if (code === "domain_already_in_use" || code === "domain_already_exists") return { ok: true };
  return { ok: false, taken: r.status === 409 };
}

export async function removeDomain(domain: string): Promise<void> {
  await vercel(`/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`, { method: "DELETE" });
}

// Ativo quando a Vercel já confirmou o domínio e o DNS aponta para nós
export async function checkDomain(domain: string): Promise<DomainCheck> {
  const d = encodeURIComponent(domain);
  let info = await vercel(`/v9/projects/${project()}/domains/${d}`);
  if (info.ok && info.body.verified === false) {
    await vercel(`/v9/projects/${project()}/domains/${d}/verify`, { method: "POST" });
    info = await vercel(`/v9/projects/${project()}/domains/${d}`);
  }
  const verified = info.ok && info.body.verified === true;
  const challenge = (info.body.verification as { type: string; domain: string; value: string }[] | undefined)?.find((v) => v.type === "TXT");
  const config = await vercel(`/v6/domains/${d}/config`);
  const configured = config.ok && config.body.misconfigured === false;
  return {
    active: verified && configured,
    txt: !verified && challenge ? { name: challenge.domain, value: challenge.value } : null,
  };
}

// Link público de um pedido: no domínio do escritório quando está ativo (e o plano o inclui), senão no nosso
type DomainOffice = { plan?: string | null; custom_domain?: string | null; custom_domain_status?: string | null };
export function hasOwnDomain(o: DomainOffice | null | undefined): boolean {
  return Boolean(o?.custom_domain && o.custom_domain_status === "active" && (o.plan === "office" || o.plan === "trial"));
}
export function clientBase(o?: DomainOffice | null): string {
  return hasOwnDomain(o) ? `https://${o!.custom_domain}` : site.clientUrl;
}
