export type TaskUrgency = 'overdue' | 'urgent' | 'soon' | 'ok';

export interface TaskUrgencyInfo {
  level: TaskUrgency;
  label: string;
  badgeVariant: 'danger' | 'warning' | 'success';
  pulse: boolean;
}

/** Days until deadline (negative = overdue). */
export function getDaysUntilDeadline(fechaEntregaStr: string): number {
  const ahora = new Date();
  const entrega = new Date(fechaEntregaStr);
  return (entrega.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24);
}

export function getTaskUrgency(fechaEntregaStr: string): TaskUrgencyInfo {
  const days = getDaysUntilDeadline(fechaEntregaStr);

  if (days < 0) {
    return { level: 'overdue', label: 'Vencida', badgeVariant: 'danger', pulse: true };
  }
  if (days <= 3) {
    return { level: 'urgent', label: days < 1 ? 'Urgente (< 24h)' : `Por vencer (${Math.ceil(days)}d)`, badgeVariant: 'warning', pulse: days < 1 };
  }
  return { level: 'ok', label: `Al día (${Math.ceil(days)}d)`, badgeVariant: 'success', pulse: false };
}
