import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy', { locale: id });
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id });
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
}

export function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    kepala_balai: 'bg-purple-100 text-purple-700',
    kepala_seksi: 'bg-blue-100 text-blue-700',
    project_manager: 'bg-green-100 text-green-700',
    scrum_master: 'bg-orange-100 text-orange-700',
    staff: 'bg-slate-100 text-slate-700',
  };
  return colors[role] || 'bg-slate-100 text-slate-700';
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    kepala_balai: 'Product Owner',
    kepala_seksi: 'Product Manager',
    project_manager: 'Project Manager',
    scrum_master: 'Scrum Master',
    staff: 'Staff',
  };
  return labels[role] || role;
}

export function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };
  return colors[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-purple-100 text-purple-700',
    done: 'bg-green-100 text-green-700',
    planned: 'bg-slate-100 text-slate-600',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
    planned: 'Planned',
    active: 'Active',
    completed: 'Completed',
  };
  return labels[status] || status;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getDashboardPath(role: string) {
  const paths: Record<string, string> = {
    kepala_balai: '/dashboard/kepala-balai',
    kepala_seksi: '/dashboard/kepala-seksi',
    project_manager: '/dashboard/project-manager',
    scrum_master: '/dashboard/scrum-master',
    staff: '/dashboard/staff',
    superadmin: '/dashboard/superadmin',
    administrator: '/dashboard',
  };
  return paths[role] || '/dashboard';
}
