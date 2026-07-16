import { NextRequest, NextResponse } from 'next/server';

// Route yang bisa diakses semua role yang sudah login
const AUTHENTICATED_ROUTES = [
  '/dashboard',
  '/notifications',
  '/settings',
  '/calendar',
  '/daily-brief',
  '/change-management',
  '/assets',
  '/documents',
  '/tasks',
  '/projects',
  '/storage',
  '/esign',
];

// Route khusus per role
const ROLE_ROUTES: Record<string, string[]> = {
  administrator: ['/admin'],
  kepala_balai: [
    '/dashboard/kepala-balai',
    '/reports',
    '/workload',
  ],
  kepala_seksi: [
    '/dashboard/kepala-seksi',
    '/reports',
    '/workload',
  ],
  project_manager: [
    '/dashboard/project-manager',
    '/reports',
    '/workload',
  ],
  scrum_master: [
    '/dashboard/scrum-master',
    '/reports',
    '/workload',
  ],
  staff: [
    '/dashboard/staff',
    '/workload',
  ],
};

// Dashboard default per role
const ROLE_DEFAULT_DASHBOARD: Record<string, string> = {
  administrator: '/admin/users',
  kepala_balai: '/dashboard/kepala-balai',
  kepala_seksi: '/dashboard/kepala-seksi',
  project_manager: '/dashboard/project-manager',
  scrum_master: '/dashboard/scrum-master',
  staff: '/dashboard/staff',
};

const ROLE_ORDER = ['administrator', 'kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'];

function getPrimaryRole(roles: string[]): string | null {
  return ROLE_ORDER.find(r => roles.includes(r)) ?? roles[0] ?? null;
}

function canAccess(pathname: string, roles: string[]): boolean {
  // Cek authenticated routes (semua role boleh)
  if (AUTHENTICATED_ROUTES.some(r => pathname.startsWith(r))) return true;

  // Cek role-specific routes
  for (const role of roles) {
    const allowed = ROLE_ROUTES[role] ?? [];
    if (allowed.some(r => pathname.startsWith(r))) return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip login page dan assets
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Ambil token dan user dari cookie/header
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Ambil user dari cookie (kita simpan roles di cookie juga)
  const userRaw = request.cookies.get('user_roles')?.value;
  if (!userRaw) {
    // Tidak ada info role, redirect ke login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let roles: string[] = [];
  try {
    roles = JSON.parse(decodeURIComponent(userRaw));
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect /dashboard ke dashboard sesuai role
  if (pathname === '/dashboard') {
    const primaryRole = getPrimaryRole(roles);
    const defaultDash = primaryRole ? ROLE_DEFAULT_DASHBOARD[primaryRole] : '/login';
    return NextResponse.redirect(new URL(defaultDash ?? '/login', request.url));
  }

  // Cek akses
  if (!canAccess(pathname, roles)) {
    const primaryRole = getPrimaryRole(roles);
    const defaultDash = primaryRole ? ROLE_DEFAULT_DASHBOARD[primaryRole] : '/login';
    return NextResponse.redirect(new URL(defaultDash ?? '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|.*\.png|.*\.jpg|.*\.svg|.*\.ico|.*\.webp).*)'],
};
