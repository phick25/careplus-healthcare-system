'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  clearPatientSession,
  getPatientSession,
  type PatientSession,
} from '../services/patient-auth.client';
import { readPatientAppointments } from '../services/booking.client';

const navigationItems = [
  { href: '/', label: 'Trang chủ' },
  { href: '/booking', label: 'Đặt lịch khám' },
  { href: '/doctors', label: 'Đội ngũ Bác sĩ' },
  { href: '/news', label: 'Kiến thức Y khoa' },
  { href: '/my-appointments', label: 'Lịch hẹn của tôi' },
];

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0] ?? '')
    .join('')
    .toLocaleUpperCase('vi');
}

export function PatientHeader() {
  const pathname = usePathname();
  const [patient, setPatient] = useState<PatientSession | null>();
  const [upcomingAppointmentCount, setUpcomingAppointmentCount] = useState(0);
  const [storageError, setStorageError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPatient = () => {
      let currentPatient: PatientSession | null;
      try {
        currentPatient = getPatientSession();
        setPatient(currentPatient);
      } catch {
        setPatient(null);
        setUpcomingAppointmentCount(0);
        setStorageError('Không thể đọc phiên bệnh nhân từ bộ nhớ trình duyệt.');
        return;
      }

      if (!currentPatient) {
        setUpcomingAppointmentCount(0);
        setStorageError('');
        return;
      }

      try {
        const count = readPatientAppointments(currentPatient)
          .filter((appointment) => appointment.status === 'CONFIRMED')
          .length;
        setUpcomingAppointmentCount(count);
        setStorageError('');
      } catch (error: unknown) {
        setUpcomingAppointmentCount(0);
        setStorageError(error instanceof Error
          ? error.message
          : 'Không thể đọc danh sách lịch hẹn đã lưu.');
      }
    };

    syncPatient();
    window.addEventListener('patient_session_updated', syncPatient);
    window.addEventListener('storage', syncPatient);
    window.addEventListener('patient_appointments_updated', syncPatient);
    window.addEventListener('appointments_updated', syncPatient);
    return () => {
      window.removeEventListener('patient_session_updated', syncPatient);
      window.removeEventListener('storage', syncPatient);
      window.removeEventListener('patient_appointments_updated', syncPatient);
      window.removeEventListener('appointments_updated', syncPatient);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node
        && !userMenuRef.current?.contains(event.target)
        && !mobileUserMenuRef.current?.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleLogout() {
    try {
      clearPatientSession();
      setPatient(null);
      setStorageError('');
      setIsMenuOpen(false);
      setIsMobileMenuOpen(false);
      window.location.href = '/auth';
    } catch {
      setStorageError('Không thể đăng xuất. Vui lòng kiểm tra cài đặt trình duyệt.');
    }
  }

  function renderNavigation(mobile = false) {
    return navigationItems.map(({ href, label }) => {
      const isActive = href === '/'
        ? pathname === '/'
        : pathname === href || pathname?.startsWith(`${href}/`);

      return (
        <Link
          key={href}
          href={href}
          aria-current={isActive ? 'page' : undefined}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`${mobile
            ? 'flex items-center justify-between rounded-xl px-4 py-3'
            : 'relative whitespace-nowrap px-2 py-2 after:absolute after:bottom-0 after:left-2 after:h-0.5 after:w-[calc(100%-1rem)] after:origin-left after:rounded-full after:bg-teal-600 after:transition-transform after:duration-200'
          } text-sm transition-colors ${
            isActive
              ? 'font-semibold text-teal-600'
              : 'text-slate-600 hover:text-teal-600'
          } ${mobile ? '' : isActive ? 'after:scale-x-100' : 'after:scale-x-0'}`}
        >
          <span>{label}</span>
          {patient && href === '/my-appointments' && upcomingAppointmentCount > 0 ? (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-rose-700">
              {upcomingAppointmentCount}
              <span className="sr-only">lịch sắp tới</span>
            </span>
          ) : null}
        </Link>
      );
    });
  }

  function renderAccountActions(mobile = false) {
    if (patient) {
      return (
        <div className={mobile ? 'relative grid gap-2' : 'relative'} ref={mobile ? mobileUserMenuRef : userMenuRef}>
          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsMenuOpen((open) => !open)}
            className={`flex items-center gap-2 rounded-xl text-left transition-colors hover:bg-slate-100 ${
              mobile ? 'w-full px-3 py-2.5' : 'max-w-56 px-2 py-1.5'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
              {getInitials(patient.fullName)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{patient.fullName}</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          <div
            role="menu"
            aria-label="Tài khoản bệnh nhân"
            className={`${
              isMenuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
            } z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-lg transition-all duration-150 ${
              mobile
                ? 'absolute left-0 right-0 top-full mt-1 w-full'
                : 'absolute right-0 top-full mt-2 w-64'
            }`}
          >
            <Link role="menuitem" href="/profile" onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-teal-700">
              Hồ sơ sức khỏe cá nhân
            </Link>
            <Link role="menuitem" href="/my-appointments" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-teal-700">
              <span>Lịch sử phiếu khám</span>
              {upcomingAppointmentCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">{upcomingAppointmentCount}</span>
              )}
            </Link>
            <Link role="menuitem" href="/profile?tab=security" onClick={() => { setIsMenuOpen(false); setIsMobileMenuOpen(false); }} className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-teal-700">
              Đổi mật khẩu
            </Link>
            <Link role="menuitem" href="/profile?tab=settings" onClick={() => { setIsMenuOpen(false); setIsMobileMenuOpen(false); }} className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-teal-700">
              Cài đặt tài khoản
            </Link>
            <div className="my-1 border-t border-slate-100" />
            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={mobile ? 'grid grid-cols-2 gap-3' : 'flex items-center gap-2'}>
        <Link
          href="/auth"
          onClick={() => setIsMobileMenuOpen(false)}
          className="rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-teal-700"
        >
          Đăng nhập
        </Link>
        <Link
          href="/booking"
          onClick={() => setIsMobileMenuOpen(false)}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95"
        >
          Đặt khám ngay
        </Link>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid min-h-[76px] grid-cols-[1fr_auto] items-center gap-3 xl:grid-cols-[auto_1fr_auto]">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="CarePlus - Trang chủ">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-3xl font-bold leading-none text-teal-600">
              +
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-bold leading-5 tracking-tight text-slate-900">
                Care<span className="text-teal-600">Plus</span>
              </span>
              <span className="mt-1 block whitespace-nowrap text-[8px] font-bold tracking-[0.12em] text-slate-500 sm:text-[9px]">
                BỆNH VIỆN ĐA KHOA QUỐC TẾ
              </span>
            </span>
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden items-center justify-center gap-1 xl:flex">
            {renderNavigation()}
          </nav>

          <div className="hidden items-center justify-end gap-3 xl:flex">
            <a href="tel:19001234" className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-rose-700 transition-colors hover:text-rose-800">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 animate-pulse">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25A2.25 2.25 0 0 0 21.75 19.5v-1.372a2.25 2.25 0 0 0-1.758-2.2l-4.423-.984a2.25 2.25 0 0 0-2.418 1.02l-.97 1.455a16.5 16.5 0 0 1-7.1-7.1l1.455-.97a2.25 2.25 0 0 0 1.02-2.418l-.984-4.423A2.25 2.25 0 0 0 4.372.75H3A2.25 2.25 0 0 0 .75 3v2.25" transform="translate(1 1)" />
              </svg>
              <span>1900 1234 <span className="font-medium text-rose-600">(Cấp cứu 24/7)</span></span>
            </a>
            {renderAccountActions()}
          </div>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="patient-mobile-menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center justify-self-end rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 xl:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {isMobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        <div
          id="patient-mobile-menu"
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out xl:hidden ${
            isMobileMenuOpen ? 'max-h-[34rem] border-t border-slate-100 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-4 py-4">
            <nav aria-label="Điều hướng di động" className="grid gap-1">
              {renderNavigation(true)}
            </nav>
            <a href="tel:19001234" className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <span aria-hidden="true" className="animate-pulse">☎</span>
              1900 1234 · Cấp cứu 24/7
            </a>
            {renderAccountActions(true)}
          </div>
        </div>
      </div>
      {storageError && (
        <p role="status" className="mx-auto max-w-7xl px-4 pb-3 text-xs text-amber-800 sm:px-6">
          {storageError}
        </p>
      )}
    </header>
  );
}
