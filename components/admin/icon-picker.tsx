"use client";

import { LucideIcon } from "lucide-react";
import { ICON_MAP, getIconComponent, getIconName } from "@/lib/utils/icon-utils";

const AVAILABLE_ICONS: { name: string; Icon: LucideIcon }[] = Object.entries(ICON_MAP).map(
  ([name, Icon]) => ({ name, Icon })
);

export const DEFAULT_ICON_NAME = AVAILABLE_ICONS[0].name;

// Re-export for convenience
export { getIconComponent, getIconName };

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {AVAILABLE_ICONS.map(({ name, Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
            value === name
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          title={name}
        >
          <Icon className="w-6 h-6 mx-auto" />
        </button>
      ))}
    </div>
  );
}

