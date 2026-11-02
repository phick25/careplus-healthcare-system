import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarePlus | Cổng quản trị bệnh viện',
  description: 'Quản lý tiếp nhận, lịch khám và ca khám bệnh viện.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
