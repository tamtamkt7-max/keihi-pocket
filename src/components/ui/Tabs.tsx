"use client";

interface Props {
  value: string;
  options: { label: string; value: string }[];
  onChange: (next: string) => void;
}

export function Tabs({ value, options, onChange }: Props) {
  return (
    <div className="wrap">
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`button ${value === item.value ? "primary" : "secondary"}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
