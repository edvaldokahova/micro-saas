"use client";

// Código de verificação em caixas (uma por número), como é habitual.
// Colar o código inteiro em qualquer caixa (ou o preenchimento automático do telemóvel, que põe tudo
// numa só) distribui os números pelas caixas; apagar recua; as setas mudam de caixa.
import { useEffect, useRef } from "react";

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  invalid = false,
  autoFocus = false,
  label,
  disabled = false,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
  label?: string;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // O valor guarda as caixas vazias como espaço, para os números não mudarem de lugar.
  // Quem usa o componente lê o código com value.replace(/\s/g, "").
  const digits = Array.from({ length }, (_, i) => (value[i] ?? " ").trim());
  const join = (arr: string[]) => arr.map((x) => x || " ").join("").trimEnd();

  function focus(i: number) {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  }

  // Escreve números a partir da caixa «start» (um só, vários colados ou do preenchimento automático)
  function put(start: number, raw: string) {
    const nums = raw.replace(/\D/g, "");
    if (!nums) return;
    // Código completo colado: substitui tudo, venha de que caixa vier
    const from = nums.length >= length ? 0 : start;
    const arr = digits.slice();
    for (let k = 0; k < nums.length && from + k < length; k++) arr[from + k] = nums[k];
    const next = join(arr);
    onChange(next);
    focus(Math.min(length - 1, from + nums.length));
  }

  // Assim que as caixas ficam todas preenchidas (escrito, colado ou preenchido pelo telemóvel), entra sozinho
  const clean = value.replace(/\s/g, "");
  const fired = useRef("");
  useEffect(() => {
    if (clean.length === length && fired.current !== clean) {
      fired.current = clean;
      refs.current.forEach((el) => el?.blur());
      onComplete?.(clean);
    }
    if (clean.length < length) fired.current = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clean, length]);

  return (
    <div className="flex justify-between gap-2 sm:gap-2.5" role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={label ? `${label} ${i + 1}` : undefined}
          aria-invalid={invalid}
          onFocus={(e) => e.currentTarget.select()}
          onPaste={(e) => {
            e.preventDefault();
            put(i, e.clipboardData.getData("text"));
          }}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              const arr = digits.slice();
              arr[i] = "";
              onChange(join(arr));
              return;
            }
            // Ao escrever por cima, fica só o número novo; o preenchimento automático traz vários
            put(i, v.length > 1 && v.startsWith(d) && d ? v.slice(1) : v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              e.preventDefault();
              const arr = digits.slice();
              arr[i - 1] = "";
              onChange(join(arr));
              focus(i - 1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              focus(i - 1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              focus(i + 1);
            }
          }}
          className={`h-12 w-full min-w-0 rounded-xl border bg-ink-2 text-center font-mono text-[20px] font-medium text-ivory outline-none transition focus:border-ivory focus:ring-2 focus:ring-ivory/15 disabled:opacity-60 sm:h-14 sm:text-[22px] ${
            invalid ? "border-bad" : d ? "border-line-strong" : "border-line"
          }`}
        />
      ))}
    </div>
  );
}
