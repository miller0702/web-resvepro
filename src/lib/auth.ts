export interface AuthUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  roles?: string[];
  impersonatedBy?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const IMPERSONATOR_KEY = 'impersonatorSession';

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem(IMPERSONATOR_KEY);
}

export function saveAuth(tokens: { accessToken: string; refreshToken: string }, user: unknown) {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function isImpersonating(): boolean {
  return Boolean(getUser()?.impersonatedBy);
}

export function saveImpersonatorSession(): void {
  const session: AuthSession = {
    accessToken: localStorage.getItem('accessToken') ?? '',
    refreshToken: localStorage.getItem('refreshToken') ?? '',
    user: getUser() ?? {},
  };
  localStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(session));
}

export function restoreImpersonatorSession(): boolean {
  const raw = localStorage.getItem(IMPERSONATOR_KEY);
  if (!raw) return false;
  const session = JSON.parse(raw) as AuthSession;
  saveAuth(
    { accessToken: session.accessToken, refreshToken: session.refreshToken },
    session.user,
  );
  localStorage.removeItem(IMPERSONATOR_KEY);
  return true;
}

export function getUserInitials(user: AuthUser | null): string {
  if (!user) return '?';
  const a = user.firstName?.trim()?.[0] ?? user.email?.[0] ?? '?';
  const b = user.lastName?.trim()?.[0] ?? '';
  return `${a}${b}`.toUpperCase();
}
