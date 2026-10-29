// Escolha do acesso ao painel de um responsável: três perfis claros em vez de uma lista de permissões.
// A opção "ver todos os clientes" só aparece para colaboradores (só CSS, sem JavaScript).
type Access = "none" | "member" | "admin";

export function AccessFields({
  defaultAccess = "none",
  defaultSeeAll = false,
  t,
  idPrefix,
}: {
  defaultAccess?: Access;
  defaultSeeAll?: boolean;
  t: { accessLabel: string; access: Record<Access, string>; accessHint: Record<Access, string>; seeAll: string };
  idPrefix: string;
}) {
  return (
    <fieldset className="group/acc">
      <legend className="label">{t.accessLabel}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {(["none", "member", "admin"] as const).map((a) => (
          <label
            key={a}
            htmlFor={`${idPrefix}-${a}`}
            className="choice cursor-pointer rounded-lg px-3 py-2.5"
          >
            <input id={`${idPrefix}-${a}`} type="radio" name="access" value={a} defaultChecked={defaultAccess === a} className="sr-only" />
            <span className="block text-sm font-medium">{t.access[a]}</span>
            <span className="mt-0.5 block text-xs leading-5 text-muted">{t.accessHint[a]}</span>
          </label>
        ))}
      </div>
      <label className="mt-3 hidden items-center gap-2.5 text-sm group-has-[[value=member]:checked]/acc:flex">
        <input type="checkbox" name="see_all" value="1" defaultChecked={defaultSeeAll} className="h-4 w-4 accent-[var(--color-ivory)]" />
        {t.seeAll}
      </label>
    </fieldset>
  );
}
