type SettingFieldLabelProps = {
  label: string;
  tip: string;
};

function SettingInfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/25 text-[10px] font-bold text-white/70">
        !
      </span>
      <span className="pointer-events-none absolute left-1/2 bottom-full z-40 mb-2 w-44 -translate-x-1/2 rounded-lg bg-black px-3 py-2 text-xs leading-5 text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

export function SettingFieldLabel({ label, tip }: SettingFieldLabelProps) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
      {label}
      <SettingInfoTip text={tip} />
    </span>
  );
}

type SettingNumberFieldProps = {
  label: string;
  tip: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

export function SettingNumberField({
  label,
  tip,
  value,
  min,
  max,
  step,
  onChange,
}: SettingNumberFieldProps) {
  return (
    <label className="grid gap-1.5">
      <SettingFieldLabel label={label} tip={tip} />
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isFinite(nextValue)) {
            onChange(nextValue);
          }
        }}
        className="h-10 rounded-lg border border-white/10 bg-[#101114] px-3 text-sm text-white outline-none [appearance:textfield] transition focus:border-green-500/70 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </label>
  );
}
