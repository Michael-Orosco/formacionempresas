"use client";

type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "brand";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-slate-50 text-slate-600 border-slate-200",
  brand: "bg-brand-red/10 text-brand-red border-brand-red/20",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${variantClasses[variant]} ${pulse ? "urgent-pulse" : ""} ${className}`}
    >
      {children}
    </span>
  );
}

/** Map role/plan strings to badge variants */
export function roleBadgeVariant(rol: string): BadgeVariant {
  switch (rol) {
    case "DOCENTE":
      return "warning";
    case "ESTUDIANTE":
      return "success";
    case "PADRE":
      return "neutral";
    case "PREMIUM":
    case "BASICO":
    case "ESTANDAR":
      return "brand";
    default:
      return "neutral";
  }
}

export function riesgoBadgeVariant(nivel: string): BadgeVariant {
  switch (nivel.toUpperCase()) {
    case "ALTO":
      return "danger";
    case "MEDIO":
      return "warning";
    case "BAJO":
      return "success";
    default:
      return "neutral";
  }
}
