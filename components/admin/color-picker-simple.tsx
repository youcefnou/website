"use client";

const AVAILABLE_COLORS = [
  { name: "Blue", class: "bg-blue-500", border: "border-blue-500" },
  { name: "Green", class: "bg-green-500", border: "border-green-500" },
  { name: "Purple", class: "bg-purple-500", border: "border-purple-500" },
  { name: "Orange", class: "bg-orange-500", border: "border-orange-500" },
  { name: "Red", class: "bg-red-500", border: "border-red-500" },
  { name: "Pink", class: "bg-pink-500", border: "border-pink-500" },
  { name: "Yellow", class: "bg-yellow-500", border: "border-yellow-500" },
  { name: "Cyan", class: "bg-cyan-500", border: "border-cyan-500" },
];

interface ColorPickerSimpleProps {
  value: string;
  onChange: (colorClass: string) => void;
}

export function ColorPickerSimple({ value, onChange }: ColorPickerSimpleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {AVAILABLE_COLORS.map(({ name, class: colorClass, border }) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(colorClass)}
          className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${colorClass} ${
            value === colorClass ? `ring-2 ring-offset-2 ${border}` : "border-gray-200"
          }`}
          title={name}
        />
      ))}
    </div>
  );
}
