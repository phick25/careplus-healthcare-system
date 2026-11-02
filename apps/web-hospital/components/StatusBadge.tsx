import type { AppointmentStatus } from '@packages/shared-types';

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã tiếp nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

const statusClasses: Record<AppointmentStatus, string> = {
  PENDING_PAYMENT: 'status-pending',
  CONFIRMED: 'status-confirmed',
  CHECKED_IN: 'status-checked',
  COMPLETED: 'status-completed',
  CANCELLED: 'status-cancelled',
  NO_SHOW: 'status-no-show',
};

export default function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`status ${statusClasses[status]}`}>{statusLabels[status]}</span>;
}
