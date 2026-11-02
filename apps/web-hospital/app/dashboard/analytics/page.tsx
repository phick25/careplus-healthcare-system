'use client';

import { useState } from 'react';
import DashboardShell from '../../../components/DashboardShell';

type Period = 'today' | 'week' | 'month';
type HourlyStat = { label: string; value: number };
type SpecialtyStat = { label: string; value: number; color: string };
type AnalyticsData = {
  visits: number;
  vnpayRevenue: number;
  showUpRate: number;
  noShowRate: number;
  hourly: HourlyStat[];
  specialties: SpecialtyStat[];
};

const periods: { id: Period; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'week', label: '7 ngày qua' },
  { id: 'month', label: 'Tháng này' },
];

const analytics: Record<Period, AnalyticsData> = {
  today: {
    visits: 86,
    vnpayRevenue: 18_650_000,
    showUpRate: 91.8,
    noShowRate: 8.2,
    hourly: [
      { label: '07:00', value: 8 },
      { label: '08:00', value: 18 },
      { label: '09:00', value: 27 },
      { label: '10:00', value: 22 },
      { label: '11:00', value: 15 },
      { label: '13:00', value: 12 },
      { label: '14:00', value: 20 },
      { label: '15:00', value: 16 },
      { label: '16:00', value: 9 },
    ],
    specialties: [
      { label: 'Tim mạch', value: 28, color: '#218c7e' },
      { label: 'Hô hấp', value: 24, color: '#67b7a9' },
      { label: 'Tiêu hóa', value: 18, color: '#a3d4ca' },
    ],
  },
  week: {
    visits: 524,
    vnpayRevenue: 126_480_000,
    showUpRate: 93.2,
    noShowRate: 6.8,
    hourly: [
      { label: '07:00', value: 46 },
      { label: '08:00', value: 73 },
      { label: '09:00', value: 92 },
      { label: '10:00', value: 81 },
      { label: '11:00', value: 56 },
      { label: '13:00', value: 42 },
      { label: '14:00', value: 68 },
      { label: '15:00', value: 61 },
      { label: '16:00', value: 34 },
    ],
    specialties: [
      { label: 'Tim mạch', value: 172, color: '#218c7e' },
      { label: 'Hô hấp', value: 138, color: '#67b7a9' },
      { label: 'Tiêu hóa', value: 116, color: '#a3d4ca' },
    ],
  },
  month: {
    visits: 2_184,
    vnpayRevenue: 486_750_000,
    showUpRate: 94.6,
    noShowRate: 5.4,
    hourly: [
      { label: '07:00', value: 184 },
      { label: '08:00', value: 302 },
      { label: '09:00', value: 386 },
      { label: '10:00', value: 341 },
      { label: '11:00', value: 246 },
      { label: '13:00', value: 192 },
      { label: '14:00', value: 284 },
      { label: '15:00', value: 231 },
      { label: '16:00', value: 148 },
    ],
    specialties: [
      { label: 'Tim mạch', value: 708, color: '#218c7e' },
      { label: 'Hô hấp', value: 586, color: '#67b7a9' },
      { label: 'Tiêu hóa', value: 492, color: '#a3d4ca' },
    ],
  },
};

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function AppointmentVolumeChart({ data }: { data: HourlyStat[] }) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  return (
    <div
      aria-label="Biểu đồ lượt khám theo khung giờ"
      className="flex h-56 items-end gap-2 sm:gap-3"
      role="img"
    >
      {data.map((item) => (
        <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" key={item.label}>
          <span className="text-[10px] font-medium text-slate-500">{item.value}</span>
          <div className="flex h-36 w-full items-end rounded-t-xl bg-teal-50">
            <div
              className="w-full rounded-t-xl bg-hospital-500 transition-all duration-200"
              style={{ height: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
              title={`${item.label}: ${item.value} lượt`}
            />
          </div>
          <span className="text-[9px] text-slate-500 sm:text-[10px]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const data = analytics[period];
  const maxSpecialtyValue = Math.max(1, ...data.specialties.map((item) => item.value));
  const periodLabel = periods.find((item) => item.id === period)?.label.toLowerCase() ?? 'tháng này';

  return (
    <DashboardShell>
      <div className="content">
        <div className="page-heading flex-wrap">
          <div>
            <div className="eyebrow">QUẢN TRỊ / PHÂN TÍCH</div>
            <h1>Báo cáo &amp; Thống kê</h1>
            <p className="subtitle">Tổng quan hoạt động khám chữa bệnh và hiệu quả vận hành.</p>
          </div>
          <div
            aria-label="Lọc khoảng thời gian"
            className="flex rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-sm backdrop-blur-md"
            role="group"
          >
            {periods.map((item) => (
              <button
                aria-pressed={period === item.id}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                  period === item.id ? 'bg-hospital-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
                key={item.id}
                onClick={() => setPeriod(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <section
          aria-label={`Chỉ số tổng quan ${periodLabel}`}
          className="mb-[22px] grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng lượt khám</span>
              <span aria-hidden="true" className="rounded-xl bg-teal-50 px-2.5 py-2 text-sm text-teal-700">▤</span>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">
              {data.visits.toLocaleString('vi-VN')}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Trong {periodLabel}</div>
          </article>
          <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">Doanh thu tạm ứng VNPAY</span>
              <span aria-hidden="true" className="rounded-xl bg-teal-50 px-2.5 py-2 text-sm font-bold text-teal-700">₫</span>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">
              {currency.format(data.vnpayRevenue)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Giao dịch thanh toán thành công</div>
          </article>
          <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">Show-up Rate</span>
              <span aria-hidden="true" className="rounded-lg bg-emerald-50 px-2.5 py-2 text-sm text-emerald-600">✓</span>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">{data.showUpRate}%</div>
            <div className="mt-1 text-[11px] text-slate-500">Tỷ lệ bệnh nhân đến khám</div>
          </article>
          <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">No-Show Rate</span>
              <span aria-hidden="true" className="rounded-lg bg-rose-50 px-2.5 py-2 text-sm text-rose-500">!</span>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">{data.noShowRate}%</div>
            <div className="mt-1 text-[11px] text-slate-500">Tỷ lệ bệnh nhân vắng mặt</div>
          </article>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
          <section aria-labelledby="hourly-title" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-700" id="hourly-title">Khung giờ khám cao điểm</h2>
              <p className="mt-1 text-[11px] text-slate-500">Lượt khám theo từng khung giờ trong {periodLabel}</p>
            </div>
            <div className="px-5 py-5">
              <AppointmentVolumeChart data={data.hourly} />
              <p className="mt-3 text-center text-[10px] text-slate-400">Khung giờ trong ngày</p>
            </div>
          </section>

          <section aria-labelledby="specialty-title" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-700" id="specialty-title">Cơ cấu bệnh nhân theo chuyên khoa</h2>
              <p className="mt-1 text-[11px] text-slate-500">Số lượt khám trong {periodLabel}</p>
            </div>
            <div className="space-y-6 px-5 py-6">
              {data.specialties.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{item.label}</span>
                    <span className="text-slate-500">{item.value.toLocaleString('vi-VN')} lượt</span>
                  </div>
                  <div
                    aria-label={`${item.label}: ${item.value} lượt`}
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                    role="img"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color, width: `${(item.value / maxSpecialtyValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <p className="mt-4 text-right text-[10px] text-slate-400">
          Thống kê VNPAY chỉ bao gồm các khoản tạm ứng đã được xác nhận.
        </p>
      </div>
    </DashboardShell>
  );
}
