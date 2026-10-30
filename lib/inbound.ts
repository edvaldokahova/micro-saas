// Endereços de recolha por e-mail (domínio só de receção no Resend, ex.: docs.bilonai.com).
//  · um por pedido:      <inbox_code>@docs.bilonai.com  (vai na resposta dos lembretes e no botão de e-mail da página)
//  · um por escritório:  <inbox_key>@docs.bilonai.com   (para uma regra de reencaminhamento opcional)
// Enquanto INBOUND_DOMAIN não estiver definido (domínio por verificar), nada disto é usado.

export function inboundDomain(): string | null {
  const d = process.env.INBOUND_DOMAIN?.trim().toLowerCase();
  return d && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) ? d : null;
}

export function inboxAddress(code: string | null | undefined): string | null {
  const domain = inboundDomain();
  if (!domain || !code || !/^[a-z0-9]{8,32}$/.test(code)) return null;
  return `${code}@${domain}`;
}

// "Nome" <endereço>, sem caracteres que estraguem o cabeçalho
export function named(name: string, address: string): string {
  const clean = name.replace(/["<>\\,;\r\n]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? `"${clean}" <${address}>` : address;
}

// Extrai o endereço de "Nome <a@b.c>" ou "a@b.c"
export function addressOf(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = v.match(/<([^<>\s]+@[^<>\s]+)>/) ?? v.match(/([^\s<>"]+@[^\s<>"]+)/);
  return m ? m[1].toLowerCase() : null;
}
