'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const roles = ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'] as const;
type StaffRole = (typeof roles)[number];

interface LoginResponse {
  accessToken: string;
  user: {
    name?: string;
    role: StaffRole;
    hospitalId: string | null;
  };
}

interface HospitalSession {
  name: string;
  role: StaffRole;
  hospitalId: string | null;
  email?: string;
  isDemo?: boolean;
}

const dashboardByRole: Record<StaffRole, string> = {
  DOCTOR: '/dashboard/doctor',
  RECEPTIONIST: '/dashboard/reception',
  HOSPITAL_ADMIN: '/dashboard/analytics',
};

const roleLabels: Record<StaffRole, string> = {
  DOCTOR: 'Bác sĩ',
  RECEPTIONIST: 'Nhân viên tiếp nhận',
  HOSPITAL_ADMIN: 'Quản trị bệnh viện',
};

const isDemoFallbackEnabled = process.env.NODE_ENV !== 'production';

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL
  || process.env.NEXT_PUBLIC_API_URL
  || 'http://localhost:4000'
).replace(/\/$/, '');

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== 'object' || value === null || !('accessToken' in value) || !('user' in value)) {
    return false;
  }

  const response = value as { accessToken: unknown; user: unknown };
  if (typeof response.accessToken !== 'string' || typeof response.user !== 'object' || response.user === null) {
    return false;
  }

  const user = response.user as Record<string, unknown>;
  return roles.includes(user.role as StaffRole)
    && (user.hospitalId === null || typeof user.hospitalId === 'string')
    && (user.name === undefined || typeof user.name === 'string');
}

function isNetworkError(error: unknown): boolean {
  return error instanceof Error
    && /failed to fetch|network error|network request failed|networkerror|load failed/i.test(error.message);
}

async function getErrorMessage(response: Response): Promise<string> {
  if (response.status === 401) {
    return 'Thông tin đăng nhập không chính xác hoặc tài khoản đã bị khóa/vô hiệu hóa.';
  }

  const fallback = `Đăng nhập thất bại (mã ${response.status}). Vui lòng thử lại.`;
  const responseText = await response.text();
  if (!responseText) return fallback;

  try {
    const body: unknown = JSON.parse(responseText);
    if (typeof body !== 'object' || body === null || !('message' in body)) return fallback;
    const message = body.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(', ');
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>('RECEPTIONIST');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isDemoFallbackEnabled) {
        activateDemoSession();
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password, role }),
      });

      if (!response.ok) {
        setError(await getErrorMessage(response));
        return;
      }

      const payload: unknown = await response.json();
      if (!isLoginResponse(payload) || payload.user.role !== role) {
        throw new Error('Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.');
      }

      const staffSession: HospitalSession = {
        name: payload.user.name?.trim() || identifier.trim(),
        role: payload.user.role,
        hospitalId: payload.user.hospitalId,
      };

      localStorage.setItem('hospitalAccessToken', payload.accessToken);
      sessionStorage.setItem('hospitalUser', JSON.stringify(staffSession));
      router.replace(dashboardByRole[payload.user.role]);
    } catch (requestError: unknown) {
      if (isNetworkError(requestError)) {
        activateDemoSession();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function activateDemoSession() {
    const demoSession: HospitalSession = {
      name: 'BS. Nguyễn Minh Khôi',
      role,
      hospitalId: null,
      email: identifier,
      isDemo: true,
    };

    localStorage.setItem('hospitalAccessToken', 'mock_jwt_token_demo');
    sessionStorage.setItem('hospitalUser', JSON.stringify(demoSession));
    router.replace(dashboardByRole[role]);
  }

  return (
    <main className="login-page">
      <section aria-labelledby="login-title" className="login-card">
        <a aria-label="CarePlus" className="login-brand" href="/">
          <span aria-hidden="true" className="login-brand-mark">+</span>
          <span>
            <strong>CarePlus</strong>
            <small>HOSPITAL PORTAL</small>
          </span>
        </a>

        <div className="login-heading">
          <p className="eyebrow">CỔNG NHÂN VIÊN</p>
          <h1 id="login-title">Đăng nhập</h1>
          <p className="subtitle">Đăng nhập để tiếp tục công việc tại bệnh viện.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="identifier">Email hoặc số CCCD</label>
            <input
              autoComplete="username"
              className="control"
              id="identifier"
              name="identifier"
              onChange={(event) => setIdentifier(event.target.value)}
              required
              value={identifier}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Mật khẩu</label>
            <input
              autoComplete="current-password"
              className="control"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <div className="form-field">
            <label htmlFor="role">Vai trò</label>
            <select
              className="control"
              id="role"
              name="role"
              onChange={(event) => setRole(event.target.value as StaffRole)}
              value={role}
            >
              {roles.map((staffRole) => (
                <option key={staffRole} value={staffRole}>{roleLabels[staffRole]}</option>
              ))}
            </select>
          </div>

          {error && <div className="feedback error login-error" role="alert">{error}</div>}

          <button className="primary-button login-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="login-footer">Hệ thống quản lý bệnh viện CarePlus</p>
      </section>
    </main>
  );
}
