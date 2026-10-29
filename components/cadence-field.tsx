// Periodicidade do cliente: dois botões em vez de uma lista (só há duas opções)
export function CadenceField({
  defaultValue,
  labels,
  label,
  hint,
  disabled = false,
}: {
  defaultValue: "monthly" | "quarterly";
  labels: { monthly: string; quarterly: string };
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="label">{label}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-ink-3/50 p-1">
        {(["monthly", "quarterly"] as const).map((v) => (
          <label
            key={v}
            className="cursor-pointer rounded-lg px-3 py-2 text-center text-sm text-muted transition has-[:checked]:bg-ink-2 has-[:checked]:font-medium has-[:checked]:text-ivory has-[:checked]:shadow-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-[1.5px] has-[:focus-visible]:outline-ivory"
          >
            <input type="radio" name="cadence" value={v} defaultChecked={defaultValue === v} className="sr-only" />
            {labels[v]}
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    </fieldset>
  );
}
