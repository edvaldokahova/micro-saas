import type { AuthTexts } from "@/components/auth-form";
import type { Dictionary } from "@/lib/i18n";

// Só texto simples segue para o navegador (funções do dicionário ficam no servidor)
export function authTexts(d: Dictionary): AuthTexts {
  const a = d.auth;
  return {
    officeName: a.officeName,
    language: d.common.language,
    email: a.email,
    acceptA: a.acceptA,
    acceptTerms: a.acceptTerms,
    acceptAnd: a.acceptAnd,
    acceptPrivacy: a.acceptPrivacy,
    submitSignup: a.submitSignup,
    submitLogin: a.submitLogin,
    sending: a.sending,
    checkTitle: a.checkTitle,
    checkTextA: a.checkTextA,
    checkTextB: a.checkTextB,
    rateLimit: a.rateLimit,
  };
}
