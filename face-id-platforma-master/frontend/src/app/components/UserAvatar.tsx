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
    <span style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3949AB&color=fff&size=${size}`;
        }}
      />
      {dotColor && (
        <span
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: size > 40 ? 12 : 9,
            height: size > 40 ? 12 : 9,
            borderRadius: "50%",
            backgroundColor: dotColor,
            border: "2px solid #fff",
          }}
        />
      )}
    </span>
  );
}
