"use client";

import { getInitials, getRoleAvatarClass } from "@/lib/avatar";

interface AvatarProps {
  nombre: string;
  rol: string;
  size?: "sm" | "md";
}

export function Avatar({ nombre, rol, size = "sm" }: AvatarProps) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${getRoleAvatarClass(rol)}`}
      aria-hidden
    >
      {getInitials(nombre)}
    </div>
  );
}
