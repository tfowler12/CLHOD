import React, { useMemo } from "react";

export function FilterSelect({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: string[];
}) {
  const opts = useMemo(() => ["All", ...options.filter(Boolean)], [options]);
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <select
        className="w-full rounded-lg border px-3 py-2 bg-white h-10"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
