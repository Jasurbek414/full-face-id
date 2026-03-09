import React from "react";

interface UserAvatarProps {
  src: string;
  name: string;
  size?: number;
  online?: boolean;
  status?: "inside" | "outside" | "none";
}

export function UserAvatar({ src, name, size = 36, online, status }: UserAvatarProps) {
  const dotColor =
    status === "inside" ? "#00C853" : status === "outside" ? "#1976D2" : online ? "#00C853" : undefined;

  return (
    <span className="relative inline-flex shrink-0">
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3949AB&color=fff&size=${size}`;
        }}
      />
      {dotColor && (
        <span
          className={`absolute bottom-0.5 right-0.5 rounded-full border-2 border-white dark:border-slate-800 ${size > 40 ? "w-3 h-3" : "w-2.5 h-2.5"}`}
          style={{ backgroundColor: dotColor }}
        />
      )}
    </span>
  );
}
