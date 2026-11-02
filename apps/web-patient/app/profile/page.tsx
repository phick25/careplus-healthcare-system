'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useEffect, useState, type FormEvent } from 'react';
import { PatientHeader } from '../../components/PatientHeader';
import {
  getPatientSettings,
  getPatientSession,
  savePatientPassword,
  savePatientSettings,
  updatePatientSession,
  verifyPatientPassword,
  type PatientSettings,
  type PatientProfile,
} from '../../services/patient-auth.client';

const inputClassName = 'mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20';
const labelClassName = 'block text-sm font-medium text-slate-700';

type ProfileTab = 'profile' | 'security' | 'settings';

const profileTabs: { id: ProfileTab; label: string }[] = [
  { id: 'profile', label: 'Thông tin cá nhân' },
  { id: 'security', label: 'Đổi mật khẩu' },
  { id: 'settings', label: 'Cài đặt tài khoản' },
];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<PatientProfile | null>();
  const [loadError, setLoadError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [settings, setSettings] = useState<PatientSettings>({
    smsZaloNotifications: true,
    emailLabResults: true,
  });
  const [settingsError, setSettingsError] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsNotice, setSettingsNotice] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordLength, setNewPasswordLength] = useState(0);

  useEffect(() => {
    try {
      setProfile(getPatientSession());
      setSettings(getPatientSettings());
    } catch {
      setLoadError('Không thể đọc dữ liệu tài khoản. Vui lòng kiểm tra cài đặt trình duyệt.');
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    setActiveTab(requestedTab === 'security' || requestedTab === 'settings' ? requestedTab : 'profile');
  }, [searchParams]);

  function selectTab(tab: ProfileTab) {
    setActiveTab(tab);
    router.replace(tab === 'profile' ? '/profile' : `/profile?tab=${tab}`, { scroll: false });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage('');
    setSaveError('');

    const formData = new FormData(event.currentTarget);
    const gender = String(formData.get('gender') ?? '');
    if (gender !== 'female' && gender !== 'male' && gender !== 'other') {
      setSaveError('Vui lòng chọn giới tính hợp lệ.');
      return;
    }

    const updatedProfile: PatientProfile = {
      fullName: String(formData.get('fullName') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      nationalId: String(formData.get('nationalId') ?? '').trim(),
      birthDate: String(formData.get('birthDate') ?? ''),
      gender,
      address: String(formData.get('address') ?? '').trim(),
      insuranceNumber: String(formData.get('insuranceNumber') ?? '').trim(),
      allergies: String(formData.get('allergies') ?? '').trim(),
      chronicConditions: String(formData.get('chronicConditions') ?? '').trim(),
    };

    setIsSaving(true);
    try {
      updatePatientSession(updatedProfile);
      setProfile(updatedProfile);
      setSaveMessage('Thông tin hồ sơ đã được cập nhật.');
    } catch {
      setSaveError('Không thể lưu hồ sơ trên thiết bị này. Vui lòng kiểm tra cài đặt trình duyệt.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get('currentPassword') ?? '');
    const newPassword = String(formData.get('newPassword') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const passwordMatches = await verifyPatientPassword(currentPassword);
      if (passwordMatches === null) {
        setPasswordError('Tài khoản chưa có mật khẩu đã lưu. Vui lòng đăng xuất rồi đăng nhập lại để thiết lập mật khẩu.');
        return;
      }
      if (!passwordMatches) {
        setPasswordError('Mật khẩu hiện tại không chính xác.');
        return;
      }

      await savePatientPassword(newPassword);
      form.reset();
      setNewPasswordLength(0);
      setPasswordMessage('Mật khẩu đã được cập nhật thành công.');
    } catch {
      setPasswordError('Không thể cập nhật mật khẩu trên thiết bị này. Vui lòng kiểm tra cài đặt trình duyệt.');
    } finally {
      setIsChangingPassword(false);
    }
  }

  function handleSettingsChange(key: keyof PatientSettings, value: boolean) {
    const updatedSettings = { ...settings, [key]: value };
    setSettingsError('');
    setSettingsMessage('');
    setSettingsNotice('');
    try {
      savePatientSettings(updatedSettings);
      setSettings(updatedSettings);
      setSettingsMessage('Cài đặt thông báo đã được lưu trên thiết bị này.');
    } catch {
      setSettingsError('Không thể lưu cài đặt trên thiết bị này. Vui lòng kiểm tra cài đặt trình duyệt.');
    }
  }

  const passwordStrength = newPasswordLength === 0
    ? 0
    : newPasswordLength >= 12 ? 2 : newPasswordLength >= 8 ? 1 : 0;
  const strengthLabels = ['Yếu', 'Vừa', 'Mạnh'];

  return (
    <main className="min-h-screen bg-slate-50/80">
      <PatientHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">HỒ SƠ BỆNH NHÂN</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Hồ sơ của tôi</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Cập nhật thông tin để sử dụng thuận tiện hơn khi đặt lịch khám.
          </p>
        </div>

        {loadError && (
          <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
        )}

        {profile === undefined ? (
          <div role="status" className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Đang tải hồ sơ...
          </div>
        ) : !profile ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Bạn chưa đăng nhập</h2>
            <p className="mt-2 text-sm text-slate-600">Đăng nhập để xem và cập nhật hồ sơ bệnh nhân.</p>
            <Link href="/auth" className="mt-5 inline-flex rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-teal-700 active:scale-[0.98]">
              Đăng nhập / Đăng ký
            </Link>
          </section>
        ) : (
          <>
            <div role="tablist" aria-label="Cài đặt hồ sơ" className="grid grid-cols-1 gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm sm:grid-cols-3">
              {profileTabs.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  id={`profile-tab-${id}`}
                  role="tab"
                  aria-controls="profile-tabpanel"
                  aria-selected={activeTab === id}
                  onClick={() => selectTab(id)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'profile' ? (
          <div id="profile-tabpanel" role="tabpanel" aria-labelledby={`profile-tab-${activeTab}`} className="profile-tab-panel mt-6 grid items-start gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-xl font-bold text-teal-700">
                  {profile.fullName.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase()}
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Hồ sơ bệnh nhân</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-800">{profile.fullName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{profile.phone}</p>
                </div>
              </div>
              <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">CCCD</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-700">{profile.nationalId}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Ngày sinh</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-700">{profile.birthDate || 'Chưa cập nhật'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
                  <dd className="mt-1 break-words text-sm font-medium text-slate-700">{profile.email || 'Chưa cập nhật'}</dd>
                </div>
              </dl>
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Lưu ý sức khỏe</p>
                <p className="mt-2 text-sm leading-5 text-amber-900">
                  {profile.allergies || profile.chronicConditions
                    ? 'Hãy đảm bảo thông tin dị ứng và bệnh nền bên dưới luôn được cập nhật.'
                    : 'Chưa ghi nhận dị ứng hoặc bệnh nền. Bạn có thể cập nhật ở biểu mẫu bên cạnh.'}
                </p>
              </div>
            </aside>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-8">
            <section>
              <h2 className="font-semibold text-slate-900">Thông tin cá nhân</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className={labelClassName}>
                  Họ và tên
                  <input required maxLength={200} name="fullName" autoComplete="name" defaultValue={profile.fullName} className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  Số điện thoại
                  <input
                    required
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    pattern="(?:\+?84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}"
                    title="Vui lòng nhập số điện thoại di động Việt Nam hợp lệ"
                    defaultValue={profile.phone}
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Email
                  <input name="email" type="email" autoComplete="email" maxLength={254} defaultValue={profile.email ?? ''} className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  Số CCCD / Định danh cá nhân
                  <input
                    required
                    name="nationalId"
                    inputMode="numeric"
                    pattern="[0-9]{12}"
                    readOnly
                    title="CCCD phải gồm đúng 12 chữ số"
                    defaultValue={profile.nationalId}
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Ngày sinh
                  <input required name="birthDate" type="date" autoComplete="bday" defaultValue={profile.birthDate} className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  Giới tính
                  <select name="gender" defaultValue={profile.gender} className={inputClassName}>
                    <option value="female">Nữ</option>
                    <option value="male">Nam</option>
                    <option value="other">Khác</option>
                  </select>
                </label>
                <label className={`${labelClassName} sm:col-span-2`}>
                  Địa chỉ thường trú
                  <textarea name="address" maxLength={1000} rows={2} autoComplete="street-address" defaultValue={profile.address ?? ''} className={`${inputClassName} resize-y`} />
                </label>
                <label className={`${labelClassName} sm:col-span-2`}>
                  Số thẻ BHYT <span className="font-normal text-slate-400">(không bắt buộc)</span>
                  <input name="insuranceNumber" maxLength={30} defaultValue={profile.insuranceNumber ?? ''} className={inputClassName} />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900">Tiền sử dị ứng &amp; Bệnh nền</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className={labelClassName}>
                  Tiền sử dị ứng
                  <textarea
                    name="allergies"
                    maxLength={5000}
                    rows={4}
                    placeholder="Ví dụ: Dị ứng nhẹ với penicillin"
                    defaultValue={profile.allergies ?? ''}
                    className={`${inputClassName} resize-y`}
                  />
                </label>
                <label className={labelClassName}>
                  Bệnh mãn tính / Tiền sử bệnh
                  <textarea
                    name="chronicConditions"
                    maxLength={5000}
                    rows={4}
                    placeholder="Ví dụ: Tiền sử hen suyễn"
                    defaultValue={profile.chronicConditions ?? ''}
                    className={`${inputClassName} resize-y`}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Thông tin này giúp nhân viên y tế tham khảo khi tiếp nhận lịch khám.
              </p>
            </section>

            {saveMessage && <p role="status" className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">{saveMessage}</p>}
            {saveError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <Link href="/booking" className="text-sm font-medium text-teal-700 transition hover:text-teal-900">
                ← Quay lại đặt lịch
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
            </form>
          </div>
            ) : activeTab === 'security' ? (
              <section id="profile-tabpanel" role="tabpanel" aria-labelledby={`profile-tab-${activeTab}`} className="profile-tab-panel mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
                <div className="max-w-2xl">
                  <h2 className="text-xl font-semibold text-slate-900">Bảo mật tài khoản</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Dùng mật khẩu mới có ít nhất 8 ký tự và không chia sẻ mật khẩu với người khác.</p>

                  <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
                    <label className={labelClassName}>
                      Mật khẩu hiện tại
                      <span className="relative block">
                        <input
                          required
                          name="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          className={`${inputClassName} pr-16`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((visible) => !visible)}
                          aria-label={showCurrentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                          className="absolute inset-y-1.5 right-2 rounded-lg px-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          {showCurrentPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                      </span>
                    </label>

                    <label className={labelClassName}>
                      Mật khẩu mới
                      <span className="relative block">
                        <input
                          required
                          minLength={8}
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          onChange={(event) => setNewPasswordLength(event.currentTarget.value.length)}
                          className={`${inputClassName} pr-16`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((visible) => !visible)}
                          aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                          className="absolute inset-y-1.5 right-2 rounded-lg px-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          {showNewPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                      </span>
                      <span className="mt-3 flex items-center gap-2" aria-live="polite">
                        {[0, 1, 2].map((level) => (
                          <span
                            key={level}
                            className={`h-1.5 flex-1 rounded-full ${
                              passwordStrength >= level
                                ? passwordStrength === 0 ? 'bg-rose-400' : passwordStrength === 1 ? 'bg-amber-400' : 'bg-emerald-500'
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                        <span className={`min-w-10 text-right text-xs font-medium ${
                          passwordStrength === 0 ? 'text-rose-600' : passwordStrength === 1 ? 'text-amber-700' : 'text-emerald-700'
                        }`}>
                          {newPasswordLength === 0 ? 'Yếu' : strengthLabels[passwordStrength]}
                        </span>
                      </span>
                    </label>

                    <label className={labelClassName}>
                      Xác nhận mật khẩu mới
                      <span className="relative block">
                        <input
                          required
                          minLength={8}
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          className={`${inputClassName} pr-16`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((visible) => !visible)}
                          aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                          className="absolute inset-y-1.5 right-2 rounded-lg px-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                      </span>
                    </label>

                    {passwordMessage && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{passwordMessage}</p>}
                    {passwordError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{passwordError}</p>}

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </form>
                </div>
              </section>
            ) : (
              <section id="profile-tabpanel" role="tabpanel" aria-labelledby={`profile-tab-${activeTab}`} className="profile-tab-panel mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
                <div className="max-w-3xl">
                  <h2 className="text-xl font-semibold text-slate-900">Thông báo &amp; tiện ích</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Tùy chỉnh thông báo được lưu trên thiết bị hiện tại.</p>

                  <div className="mt-6 divide-y divide-slate-100">
                    <label className="flex cursor-pointer items-center justify-between gap-5 py-5 first:pt-0">
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">Nhận thông báo lịch khám qua SMS &amp; Zalo</span>
                        <span className="mt-1 block text-sm text-slate-500">Nhắc lịch và cập nhật trạng thái cuộc hẹn.</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.smsZaloNotifications}
                        onChange={(event) => handleSettingsChange('smsZaloNotifications', event.currentTarget.checked)}
                        className="h-5 w-5 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between gap-5 py-5">
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">Nhận kết quả xét nghiệm qua Email</span>
                        <span className="mt-1 block text-sm text-slate-500">Gửi thông báo khi có kết quả mới.</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.emailLabResults}
                        onChange={(event) => handleSettingsChange('emailLabResults', event.currentTarget.checked)}
                        className="h-5 w-5 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </label>
                  </div>

                  {settingsMessage && <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{settingsMessage}</p>}
                  {settingsError && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{settingsError}</p>}
                  {settingsNotice && <p role="status" className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{settingsNotice}</p>}

                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h3 className="font-semibold text-slate-900">Phiên đăng nhập</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Phiên đăng nhập được lưu trên thiết bị hiện tại. Việc quản lý phiên trên các thiết bị khác chưa được hỗ trợ.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSettingsNotice('Việc kết thúc phiên trên các thiết bị khác chưa được hỗ trợ.')}
                      className="mt-4 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                    >
                      Xóa phiên đăng nhập trên các thiết bị khác
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={(
      <main className="min-h-screen bg-slate-50/80">
        <PatientHeader />
        <div role="status" className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-slate-500 sm:px-6">
          Đang tải cài đặt tài khoản...
        </div>
      </main>
    )}>
      <ProfileContent />
    </Suspense>
  );
}
