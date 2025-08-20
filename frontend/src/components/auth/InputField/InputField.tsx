import { JSX } from "react";


interface Props {
  label: string;
  icon?: JSX.Element;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

export default function InputField({
  label,
  icon,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-3 text-slate-400">{icon}</div>
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 placeholder-slate-400"
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  );
}
