import { SettingFieldLabel } from '@/components/Ui/SettingNumberField';

type SettingToggleRowProps = {
  label: string;
  tip: string;
  active: boolean;
  onClick: () => void;
};

export function SettingToggleRow({ label, tip, active, onClick }: SettingToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
      <SettingFieldLabel label={label} tip={tip} />
      <button
        type="button"
        aria-label={`${label} ${active ? '开' : '关'}`}
        onClick={onClick}
        className={`h-5 w-9 rounded-full p-0.5 transition ${active ? 'bg-green-500' : 'bg-gray-600'}`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition ${
            active ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
