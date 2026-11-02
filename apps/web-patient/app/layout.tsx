import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarePlus | Chăm sóc sức khỏe toàn diện',
  description: 'Tìm bác sĩ, khám phá chuyên khoa và đặt lịch khám trực tuyến nhanh chóng tại CarePlus.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
