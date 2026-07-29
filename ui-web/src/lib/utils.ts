import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    kepala_balai: 'bg-purple-100 text-purple-700',
    kepala_seksi: 'bg-blue-100 text-blue-700',
    project_manager: 'bg-green-100 text-green-700',
    scrum_master: 'bg-orange-100 text-orange-700',
    staff: 'bg-border-subtle text-text-secondary',
  };
  return colors[role] || 'bg-border-subtle text-text-secondary';
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

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
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
