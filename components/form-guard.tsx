"use client";

// Validação dos formulários com o aspeto do Bilonai, em todo o site: em vez da bolha do navegador
// («Preencha este campo»), o campo fica com o contorno vermelho e aparece a mensagem por baixo,
// igual à do registo. Os formulários continuam a usar `required`, `type="email"`, etc.
import { useEffect } from "react";

const TEXTS: Record<string, { missing: string; email: string; url: string; other: string }> = {
  pt: { missing: "Preencha este campo.", email: "Escreva um e-mail válido.", url: "Escreva um endereço válido.", other: "Verifique este campo." },
  "pt-BR": { missing: "Preencha este campo.", email: "Digite um e-mail válido.", url: "Digite um endereço válido.", other: "Confira este campo." },
  es: { missing: "Rellena este campo.", email: "Escribe un correo válido.", url: "Escribe una dirección válida.", other: "Revisa este campo." },
};
const ICON =
  '<svg class="mt-[3px] shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.25"/><path d="M8 4.9v3.6"/><circle cx="8" cy="11.1" r=".35" fill="currentColor"/></svg>';

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function FormGuard() {
  useEffect(() => {
    let focused = false;
    const texts = () => {
      const lang = document.documentElement.lang;
      return TEXTS[lang] ?? TEXTS[lang.slice(0, 2)] ?? TEXTS.pt;
    };
    // Campos escondidos dos nossos menus de seleção: o contorno vai para o botão e a mensagem fica por baixo do menu
    const parts = (el: Field) => {
      const proxy = el.getAttribute("aria-hidden") === "true";
      return {
        visual: (proxy ? el.nextElementSibling : el) as HTMLElement | null,
        anchor: (proxy ? el.parentElement : el) as HTMLElement | null,
      };
    };
    const clear = (el: Field) => {
      const { visual, anchor } = parts(el);
      visual?.classList.remove("!border-bad");
      el.removeAttribute("aria-invalid");
      const next = anchor?.nextElementSibling;
      if (next instanceof HTMLElement && next.dataset.guardFor === (el.name || el.id)) next.remove();
    };
    const onInvalid = (e: Event) => {
      const el = e.target as Field;
      if (!(el instanceof HTMLElement) || el.type === "hidden") return;
      e.preventDefault();
      clear(el);
      const t = texts();
      const v = el.validity;
      const msg = v.valueMissing ? t.missing : v.typeMismatch ? (el.type === "email" ? t.email : t.url) : t.other;
      const { visual, anchor } = parts(el);
      visual?.classList.add("!border-bad");
      el.setAttribute("aria-invalid", "true");
      const note = document.createElement("span");
      note.setAttribute("role", "alert");
      note.dataset.guardFor = el.name || el.id;
      note.className = "mt-1.5 flex animate-rise items-start gap-1.5 text-[13px] leading-5 text-bad [animation-duration:.2s]";
      note.innerHTML = ICON;
      note.append(document.createTextNode(msg));
      anchor?.insertAdjacentElement("afterend", note);
      // Só o primeiro campo com erro recebe o foco
      if (!focused) {
        focused = true;
        el.focus({ preventScroll: false });
        window.setTimeout(() => (focused = false), 0);
      }
    };
    const onInput = (e: Event) => {
      const el = e.target as Field;
      if (el?.getAttribute?.("aria-invalid") === "true" && el.checkValidity?.()) clear(el);
      // O menu de seleção muda o valor sem «input»: limpa quando o formulário volta a ser válido
      document.querySelectorAll<Field>('[aria-invalid="true"]').forEach((f) => f.checkValidity?.() && clear(f));
    };
    // Depois de escolher num menu, o valor muda sem evento «input»: volta a verificar logo a seguir
    const onClick = () => window.setTimeout(() => document.querySelectorAll<Field>('[aria-invalid="true"]').forEach((f) => f.checkValidity?.() && clear(f)), 0);
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  return null;
}
