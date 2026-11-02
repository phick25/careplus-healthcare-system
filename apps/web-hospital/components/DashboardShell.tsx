'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/dashboard/reception', label: 'Tiếp nhận bệnh nhân', icon: '▤' },
  { href: '/dashboard/doctor', label: 'Phòng khám bác sĩ', icon: '✚' },
  { href: '/dashboard/schedule', label: 'Lịch làm việc', icon: '▦' },
  { href: '/dashboard/analytics', label: 'Báo cáo & thống kê', icon: '▥' },
];

export default function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard/reception">
          <span className="brand-mark">+</span>
          <span><span className="brand-name">CarePlus</span><span className="brand-caption">HOSPITAL PORTAL</span></span>
        </Link>
        <div className="nav-label">Không gian làm việc</div>
        <nav aria-label="Điều hướng chính">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href === '/dashboard/doctor' && pathname === '/dashboard/doctor');
            return (
              <Link className={`nav-link${active ? ' active' : ''}`} href={item.href} key={item.href}>
                <span aria-hidden="true" className="nav-icon">{item.icon}</span>{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="hospital-card">
          <strong>Bệnh viện Đa khoa CarePlus</strong>
          <span>Đang hoạt động · TP. Hồ Chí Minh</span>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-account">
            <span className="avatar">TA</span>
            <span><strong>Trần Minh Anh</strong><small>Quản trị viên bệnh viện</small></span>
          </div>
          <button className="logout-button" onClick={handleLogout} type="button">Đăng xuất</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">CarePlus <span aria-hidden="true"> / </span><strong>Cổng quản trị</strong></div>
          <div className="top-actions"><span className="today-date">{today}</span><span className="top-avatar">TA</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}
