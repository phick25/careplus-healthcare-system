'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const roles = ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'];

function hasHospitalSession(): boolean {
  const accessToken = localStorage.getItem('hospitalAccessToken');
  const serializedUser = sessionStorage.getItem('hospitalUser');
  if (!accessToken || !serializedUser) return false;

  try {
    const user: unknown = JSON.parse(serializedUser);
    if (typeof user !== 'object' || user === null) return false;

    const session = user as Record<string, unknown>;
    return typeof session.name === 'string'
      && roles.includes(session.role as string)
      && (session.hospitalId === null || typeof session.hospitalId === 'string');
  } catch {
    return false;
  }
}

export default function DashboardSessionGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!hasHospitalSession()) {
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);
  }, [router]);

  return isAuthenticated ? children : null;
}
