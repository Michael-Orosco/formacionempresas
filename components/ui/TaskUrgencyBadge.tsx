"use client";

import { Badge } from "./Badge";
import { getTaskUrgency } from "@/lib/taskUrgency";

interface TaskUrgencyBadgeProps {
  fechaEntrega: string;
}

export function TaskUrgencyBadge({ fechaEntrega }: TaskUrgencyBadgeProps) {
  const { label, badgeVariant, pulse } = getTaskUrgency(fechaEntrega);
  return (
    <Badge variant={badgeVariant} pulse={pulse}>
      {label}
    </Badge>
  );
}
