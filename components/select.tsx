"use client";

// Menu de seleção próprio, no lugar do <select> do navegador: a lista abre logo abaixo do campo
// (ou acima, se não houver espaço), com rolagem, e com pesquisa quando há muitas opções.
// O valor vai num campo escondido com o mesmo "name", por isso os formulários continuam iguais.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { IconTick } from "@/components/icons";

export type SelectOption = { value: string; label: string; hint?: string };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Select({
  name,
  options,
  defaultValue = "",
  placeholder,
  required = false,
  disabled = false,
  searchPlaceholder,
  emptyText,
  searchFrom = 8,
  id,
  onPick,
  action = false,
  label,
  tone = "field",
  className = "",
}: {
  name?: string;
  options: SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  searchFrom?: number;
  id?: string;
  /** Chamado a cada escolha (para menus que fazem uma ação em vez de ir num formulário) */
  onPick?: (value: string) => void;
  /** Menu de ação: depois de escolher, volta a mostrar o placeholder */
  action?: boolean;
  label?: string;
  /** "field" = campo de formulário; "pill" / "pill-strong" = botão redondo pequeno */
  tone?: "field" | "pill" | "pill-strong";
  className?: string;
}) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const searchable = options.length >= searchFrom;

  const shown = useMemo(() => {
    const q = norm(query.trim());
    return q ? options.filter((o) => norm(o.label).includes(q)) : options;
  }, [options, query]);
  const current = options.find((o) => o.value === value);

  function openList() {
    if (disabled) return;
    const r = button.current?.getBoundingClientRect();
    if (r) setUp(window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom);
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }
  function close(focus = true) {
    setOpen(false);
    if (focus) button.current?.focus();
  }
  function choose(o: SelectOption) {
    if (!action) setValue(o.value);
    close();
    onPick?.(o.value);
  }

  // Fecha ao tocar fora
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Foco na pesquisa e a opção ativa sempre visível
  useEffect(() => {
    if (open && searchable) search.current?.focus({ preventScroll: true });
  }, [open, searchable]);
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) choose(shown[active]);
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  return (
    <div ref={root} className={`relative ${className}`} onKeyDown={onKey}>
      {/* Campo real que vai no formulário; o "required" usa a validação do próprio navegador */}
      {name && (
      <input
        name={name}
        value={value}
        required={required}
        onChange={() => {}}
        onFocus={() => button.current?.focus()}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0"
      />
      )}
      <button
        ref={button}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        className={`flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
          tone === "field"
            ? `field ${open ? "!border-ivory" : ""}`
            : tone === "pill-strong"
              ? "h-8 rounded-full border border-ivory bg-ivory px-3.5 text-[12.5px] font-medium text-ink"
              : `h-8 rounded-full border px-3.5 text-[12.5px] text-muted transition hover:text-ivory ${open ? "border-ivory" : "border-line-strong"}`
        }`}
      >
        <span className={`min-w-0 truncate ${current || tone !== "field" ? "" : "text-muted/80"}`}>
          {current ? current.label : placeholder}
          {current?.hint && <span className="ml-2 text-[12px] font-medium text-muted">{current.hint}</span>}
        </span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 transition ${tone === "pill-strong" ? "" : "text-muted"} ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
          <path d="M5.5 8l4.5 4.5L14.5 8" />
        </svg>
      </button>

      {open && (
        <div
          style={{ animationDuration: "140ms" }}
          className={`absolute z-40 animate-fade ${tone === "field" ? "inset-x-0" : "right-0 w-max min-w-full max-w-[min(20rem,calc(100vw-2.5rem))]"} overflow-hidden rounded-xl border border-line-strong bg-ink-2 shadow-[0_16px_40px_-16px_rgba(18,19,22,0.3)] ${up ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          {searchable && (
            <div className="border-b border-line p-2">
              <input
                ref={search}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={shown[active] ? `${uid}-${active}` : undefined}
                className="w-full bg-transparent px-2 py-1.5 text-[15px] outline-none placeholder:text-muted/70"
              />
            </div>
          )}
          <ul ref={list} id={listId} role="listbox" className="max-h-[min(17rem,45vh)] overflow-y-auto overscroll-contain py-1">
            {shown.length === 0 && <li className="px-3.5 py-3 text-sm text-muted">{emptyText}</li>}
            {shown.map((o, i) => {
              const selected = o.value === value;
              return (
                <li
                  key={o.value || "_"}
                  id={`${uid}-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={selected}
                  onPointerMove={() => setActive(i)}
                  onClick={() => choose(o)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-[15px] ${i === active ? "bg-ink-3" : ""}`}
                >
                  <span className="min-w-0 truncate">
                    {o.label}
                    {o.hint && <span className="ml-2 text-[12px] font-medium text-muted">{o.hint}</span>}
                  </span>
                  {selected && <IconTick className="h-4 w-4 shrink-0 text-ivory" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
