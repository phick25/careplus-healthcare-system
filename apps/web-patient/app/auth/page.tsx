'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import {
  findPatientProfile,
  savePatientProfile,
  savePatientPassword,
  savePatientSession,
  verifyPatientPassword,
  type PatientProfile,
} from '../../services/patient-auth.client';

type AuthMode = 'login' | 'register';

const inputClassName = 'mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20';
const labelClassName = 'block text-sm font-medium text-slate-700';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function finishSignIn(profile: PatientProfile) {
    savePatientSession(profile);
    router.replace('/');
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận chưa khớp.');
      setIsSubmitting(false);
      return;
    }

    const genderValue = String(formData.get('gender') ?? '');
    if (genderValue !== 'female' && genderValue !== 'male' && genderValue !== 'other') {
      setErrorMessage('Vui lòng chọn giới tính.');
      setIsSubmitting(false);
      return;
    }

    const profile: PatientProfile = {
      fullName: String(formData.get('fullName') ?? '').trim(),
      nationalId: String(formData.get('nationalId') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      birthDate: String(formData.get('birthDate') ?? ''),
      gender: genderValue,
    };

    try {
      if (findPatientProfile(profile.nationalId) || findPatientProfile(profile.phone)) {
        setErrorMessage('Hồ sơ với số CCCD hoặc số điện thoại này đã được đăng ký.');
        setIsSubmitting(false);
        return;
      }

      savePatientProfile(profile);
      await savePatientPassword(password, profile.nationalId);
      finishSignIn(profile);
    } catch {
      setErrorMessage('Không thể lưu tài khoản trên thiết bị này. Vui lòng kiểm tra cài đặt trình duyệt.');
      setIsSubmitting(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const identifier = String(formData.get('identifier') ?? '').trim();
      const password = String(formData.get('password') ?? '');
      const profile = findPatientProfile(identifier);
      if (!profile) {
        setErrorMessage('Không tìm thấy hồ sơ. Vui lòng kiểm tra thông tin hoặc đăng ký tài khoản.');
        setIsSubmitting(false);
        return;
      }

      const passwordMatches = await verifyPatientPassword(password, profile.nationalId);
      if (passwordMatches === false) {
        setErrorMessage('Mật khẩu không chính xác.');
        setIsSubmitting(false);
        return;
      }
      if (passwordMatches === null && password.length < 8) {
        setErrorMessage('Mật khẩu cần có ít nhất 8 ký tự.');
        setIsSubmitting(false);
        return;
      }
      if (passwordMatches === null) {
        await savePatientPassword(password, profile.nationalId);
      }

      finishSignIn(profile);
    } catch {
      setErrorMessage('Không thể lưu phiên đăng nhập. Vui lòng kiểm tra cài đặt trình duyệt.');
      setIsSubmitting(false);
    }
  }

  function handleQuickAccess() {
    setErrorMessage('');
    const form = document.getElementById('login-form');
    if (!(form instanceof HTMLFormElement)) return;

    const identifier = String(new FormData(form).get('identifier') ?? '').trim();
    if (!identifier) {
      setErrorMessage('Vui lòng nhập số điện thoại hoặc CCCD.');
      return;
    }

    try {
      const profile = findPatientProfile(identifier);
      if (!profile) {
        setErrorMessage('Không tìm thấy hồ sơ. Vui lòng kiểm tra thông tin hoặc đăng ký tài khoản.');
        return;
      }

      finishSignIn(profile);
    } catch {
      setErrorMessage('Không thể lưu phiên đăng nhập. Vui lòng kiểm tra cài đặt trình duyệt.');
    }
  }

  const date = new Date();
  const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="CarePlus - Trang chủ">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-xl font-bold text-white shadow-sm">+</span>
            <span className="text-lg font-bold tracking-tight text-slate-800">Care<span className="text-teal-700">Plus</span></span>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-600 transition hover:text-teal-700">
            ← Trang đặt lịch
          </Link>
        </header>

        <div className="mx-auto mt-8 grid max-w-5xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl lg:mt-12 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="relative hidden overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[40px] border-white/5" aria-hidden="true" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-medical-600/70" aria-hidden="true" />
            <div className="relative">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl" aria-hidden="true">✚</span>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-medical-100">Chăm sóc tận tâm</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight">
                Sức khỏe của bạn,<br />luôn được quan tâm.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-medical-50">
                Đăng nhập để quản lý thông tin và đặt lịch khám thuận tiện cùng đội ngũ y tế CarePlus.
              </p>
            </div>
            <div className="relative rounded-2xl border border-white/15 bg-white/10 p-5">
              <p className="text-sm leading-6 text-white/90">
                “Chủ động chăm sóc hôm nay, an tâm sống khỏe mỗi ngày.”
              </p>
              <p className="mt-3 text-xs font-medium text-medical-100">CarePlus · Đồng hành cùng bạn</p>
            </div>
          </aside>

          <section className="p-5 sm:p-9 lg:p-10">
            <div className="lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-wider text-medical-700">Cổng bệnh nhân CarePlus</p>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {mode === 'login' ? 'Chào mừng bạn trở lại' : 'Tạo hồ sơ bệnh nhân'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === 'login'
                ? 'Đăng nhập để tiếp tục hành trình chăm sóc sức khỏe.'
                : 'Điền thông tin để bắt đầu đặt lịch khám dễ dàng hơn.'}
            </p>

            <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Chế độ xác thực">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => { setMode('login'); setErrorMessage(''); }}
                className={`rounded-lg px-3 py-2.5 text-sm transition-all active:scale-[0.98] ${mode === 'login' ? 'bg-white font-semibold text-teal-700 shadow-sm' : 'font-medium text-slate-500 hover:text-slate-700'}`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => { setMode('register'); setErrorMessage(''); }}
                className={`rounded-lg px-3 py-2.5 text-sm transition-all active:scale-[0.98] ${mode === 'register' ? 'bg-white font-semibold text-teal-700 shadow-sm' : 'font-medium text-slate-500 hover:text-slate-700'}`}
              >
                Đăng ký
              </button>
            </div>

            {mode === 'login' ? (
              <form id="login-form" onSubmit={handleLogin} className="mt-6 space-y-4">
                <label className={labelClassName}>
                  Số điện thoại hoặc CCCD
                  <input
                    required
                    name="identifier"
                    autoComplete="username"
                    inputMode="numeric"
                    placeholder="Nhập số điện thoại hoặc CCCD"
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Mật khẩu
                  <input
                    required
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className={inputClassName}
                  />
                </label>

                {errorMessage && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{errorMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3.5 font-semibold text-white shadow-sm transition-all hover:from-teal-700 hover:to-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
                <button
                  type="button"
                  onClick={handleQuickAccess}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 px-5 py-3 text-sm font-semibold text-teal-700 transition-all hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  <span aria-hidden="true">✉</span> Đăng nhập nhanh (Quick Access)
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <label className={labelClassName}>
                  Họ và tên
                  <input required maxLength={200} name="fullName" autoComplete="name" placeholder="Nguyễn Văn An" className={inputClassName} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClassName}>
                    Số CCCD
                    <input required name="nationalId" inputMode="numeric" autoComplete="off" pattern="[0-9]{12}" title="CCCD phải gồm đúng 12 chữ số" placeholder="12 chữ số" className={inputClassName} />
                  </label>
                  <label className={labelClassName}>
                    Số điện thoại
                    <input required name="phone" type="tel" autoComplete="tel" pattern="(?:\+?84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}" title="Vui lòng nhập số điện thoại di động Việt Nam hợp lệ" placeholder="0912345678" className={inputClassName} />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClassName}>
                    Ngày sinh
                    <input required name="birthDate" type="date" max={today} autoComplete="bday" className={inputClassName} />
                  </label>
                  <label className={labelClassName}>
                    Giới tính
                    <select required name="gender" defaultValue="" className={inputClassName}>
                      <option value="" disabled>Chọn giới tính</option>
                      <option value="female">Nữ</option>
                      <option value="male">Nam</option>
                      <option value="other">Khác</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClassName}>
                    Mật khẩu
                    <input required minLength={8} name="password" type="password" autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" className={inputClassName} />
                  </label>
                  <label className={labelClassName}>
                    Xác nhận mật khẩu
                    <input required minLength={8} name="confirmPassword" type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" className={inputClassName} />
                  </label>
                </div>
                <label className="flex items-start gap-3 text-sm leading-5 text-slate-600">
                  <input required type="checkbox" name="terms" className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <span>
                    Tôi đồng ý với <span className="font-semibold text-teal-700">điều khoản dịch vụ y tế</span> và chính sách bảo mật.
                  </span>
                </label>

                {errorMessage && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{errorMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3.5 font-semibold text-white shadow-sm transition-all hover:from-teal-700 hover:to-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang tạo hồ sơ...' : 'Tạo tài khoản'}
                </button>
              </form>
            )}

            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              Thông tin tài khoản được lưu trên thiết bị hiện tại; mật khẩu được bảo vệ bằng mã băm.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
