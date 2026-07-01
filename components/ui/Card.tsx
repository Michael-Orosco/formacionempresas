"use client";

import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md";
}

interface CardHeaderProps {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
}

export function Card({
  children,
  className = "",
  hover = true,
  padding = "md",
}: CardProps) {
  const pad = padding === "sm" ? "p-4 md:p-4" : "p-4 md:p-6";
  return (
    <div
      className={`bg-white rounded-2xl border border-border-subtle shadow-sm ${hover ? "card-hover" : ""} ${pad} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ icon, title, action, className = "" }: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="text-brand-navy shrink-0">{icon}</span>}
        <h3 className="text-base font-bold text-text-primary truncate">{title}</h3>
      </div>
      {action}
    </div>
  );
}
