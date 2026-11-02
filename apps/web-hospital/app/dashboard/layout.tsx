import DashboardSessionGuard from '../../components/DashboardSessionGuard';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardSessionGuard>{children}</DashboardSessionGuard>;
}
