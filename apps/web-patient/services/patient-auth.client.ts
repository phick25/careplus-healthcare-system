export interface PatientProfile {
  fullName: string;
  nationalId: string;
  phone: string;
  birthDate: string;
  gender: 'female' | 'male' | 'other';
  email?: string;
  address?: string;
  insuranceNumber?: string;
  allergies?: string;
  chronicConditions?: string;
}

export interface PatientSession extends PatientProfile {
  signedInAt: string;
}

const SESSION_KEY = 'patient_session';
const AUTH_TOKEN_KEY = 'auth_token';
const PASSWORD_KEY = 'patient_password';
const ACCOUNTS_KEY = 'patient_accounts';
const PASSWORDS_KEY = 'patient_passwords';
const SETTINGS_KEY = 'patient_settings';
const PASSWORD_ITERATIONS = 120_000;

export interface PatientSettings {
  smsZaloNotifications: boolean;
  emailLabResults: boolean;
}

interface StoredPassword {
  salt: string;
  hash: string;
}

const defaultPatientSettings: PatientSettings = {
  smsZaloNotifications: true,
  emailLabResults: true,
};

function isPatientProfile(value: unknown): value is PatientProfile {
  if (!value || typeof value !== 'object') return false;

  const profile = value as Record<string, unknown>;
  return typeof profile.fullName === 'string'
    && typeof profile.nationalId === 'string'
    && typeof profile.phone === 'string'
    && typeof profile.birthDate === 'string'
    && (profile.gender === 'female' || profile.gender === 'male' || profile.gender === 'other')
    && (profile.email === undefined || typeof profile.email === 'string')
    && (profile.address === undefined || typeof profile.address === 'string')
    && (profile.insuranceNumber === undefined || typeof profile.insuranceNumber === 'string')
    && (profile.allergies === undefined || typeof profile.allergies === 'string')
    && (profile.chronicConditions === undefined || typeof profile.chronicConditions === 'string');
}

function readProfile<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) return null;

  try {
    const value: unknown = JSON.parse(storedValue);
    return isValid(value) ? value : null;
  } catch {
    return null;
  }
}

function isPatientSession(value: unknown): value is PatientSession {
  return isPatientProfile(value)
    && typeof (value as PatientSession).signedInAt === 'string';
}

function isStoredPassword(value: unknown): value is StoredPassword {
  if (!value || typeof value !== 'object') return false;
  const password = value as Record<string, unknown>;
  return typeof password.salt === 'string' && typeof password.hash === 'string';
}

function accountIdentifier(profile: PatientProfile): string {
  return profile.nationalId.trim() || profile.phone.trim();
}

function readPatientAccounts(): PatientProfile[] {
  const stored = window.localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) {
    const legacyProfile = readProfile(SESSION_KEY, isPatientProfile);
    return legacyProfile ? [legacyProfile] : [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Danh sách tài khoản không đúng định dạng.');
    return parsed.filter(isPatientProfile);
  } catch (error: unknown) {
    throw new Error('Không thể đọc danh sách tài khoản đã lưu.', { cause: error });
  }
}

function readPatientPasswords(): Record<string, StoredPassword> {
  const stored = window.localStorage.getItem(PASSWORDS_KEY);
  if (!stored) return {};

  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== 'object'
      || parsed === null
      || Array.isArray(parsed)
      || !Object.values(parsed).every(isStoredPassword)
    ) {
      throw new Error('Danh sách mật khẩu không đúng định dạng.');
    }
    return parsed as Record<string, StoredPassword>;
  } catch (error: unknown) {
    throw new Error('Không thể đọc thông tin xác thực đã lưu.', { cause: error });
  }
}

function savePatientAccounts(accounts: PatientProfile[]): void {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function upsertPatientProfile(profile: PatientProfile): void {
  const accounts = readPatientAccounts();
  const identifier = accountIdentifier(profile);
  const existingIndex = accounts.findIndex((account) => (
    accountIdentifier(account) === identifier
    || account.phone === profile.phone
    || account.nationalId === profile.nationalId
  ));

  if (existingIndex < 0) {
    savePatientAccounts([...accounts, profile]);
    return;
  }

  savePatientAccounts(accounts.map((account, index) => (
    index === existingIndex ? profile : account
  )));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

export function savePatientProfile(profile: PatientProfile): void {
  const legacyProfile = readProfile(SESSION_KEY, isPatientProfile);
  const legacyPassword = readProfile(PASSWORD_KEY, isStoredPassword);
  if (legacyProfile && legacyPassword) {
    const passwords = readPatientPasswords();
    passwords[accountIdentifier(legacyProfile)] = legacyPassword;
    window.localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    window.localStorage.removeItem(PASSWORD_KEY);
  }

  upsertPatientProfile(profile);
}

export function findPatientProfile(identifier: string): PatientProfile | null {
  const normalizedIdentifier = identifier.trim();
  return readPatientAccounts().find((profile) => (
    profile.phone === normalizedIdentifier || profile.nationalId === normalizedIdentifier
  )) ?? null;
}

export function savePatientSession(profile: PatientProfile): void {
  const session: PatientSession = { ...profile, signedInAt: new Date().toISOString() };
  upsertPatientProfile(profile);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('patient_session_updated'));
}

export function updatePatientSession(profile: PatientProfile): void {
  const existingSession = readProfile(SESSION_KEY, isPatientSession);
  const session: PatientSession = {
    ...profile,
    signedInAt: existingSession?.signedInAt ?? new Date().toISOString(),
  };
  upsertPatientProfile(profile);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('patient_session_updated'));
}

export function clearPatientSession(): void {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.clear();
  window.dispatchEvent(new Event('patient_session_updated'));
  window.dispatchEvent(new Event('storage'));
}

export function getPatientSession(): PatientSession | null {
  return readProfile(SESSION_KEY, isPatientSession);
}

export async function savePatientPassword(password: string, identifier?: string): Promise<void> {
  const patient = identifier
    ? findPatientProfile(identifier)
    : getPatientSession();
  const key = identifier?.trim() || (patient ? accountIdentifier(patient) : '');
  if (!key) throw new Error('Không xác định được tài khoản để lưu mật khẩu.');

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const storedPassword: StoredPassword = {
    salt: toHex(salt),
    hash: await hashPassword(password, salt),
  };
  const passwords = readPatientPasswords();
  passwords[key] = storedPassword;
  window.localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
}

export async function verifyPatientPassword(password: string, identifier?: string): Promise<boolean | null> {
  const patient = identifier
    ? findPatientProfile(identifier)
    : getPatientSession();
  const key = identifier?.trim() || (patient ? accountIdentifier(patient) : '');
  const storedPassword = key
    ? readPatientPasswords()[key]
      ?? (() => {
        const legacyProfile = readProfile(SESSION_KEY, isPatientProfile);
        return legacyProfile && accountIdentifier(legacyProfile) === key
          ? readProfile(PASSWORD_KEY, isStoredPassword)
          : null;
      })()
    : null;
  if (!storedPassword) return null;

  const actualHash = await hashPassword(password, fromHex(storedPassword.salt));
  return actualHash === storedPassword.hash;
}

export function getPatientSettings(): PatientSettings {
  const storedSettings = readProfile(SETTINGS_KEY, (value): value is PatientSettings => (
    Boolean(value)
    && typeof value === 'object'
    && typeof (value as PatientSettings).smsZaloNotifications === 'boolean'
    && typeof (value as PatientSettings).emailLabResults === 'boolean'
  ));
  return storedSettings ?? defaultPatientSettings;
}

export function savePatientSettings(settings: PatientSettings): void {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
