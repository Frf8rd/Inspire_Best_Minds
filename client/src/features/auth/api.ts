import { api } from '@/lib/api-client';
import { API_URL } from '@/lib/env';

import type { LoginBody, MessageResponse, RegisterBody, ResetPasswordBody, UserResponse } from './types';

/** Toate endpoint-urile de autentificare ale backendului, într-un singur loc. */
export const authApi = {
  register: (body: RegisterBody) => api<UserResponse>('/auth/register', { method: 'POST', body }),
  login: (body: LoginBody) => api<UserResponse>('/auth/login', { method: 'POST', body }),
  logout: () => api<MessageResponse>('/auth/logout', { method: 'POST' }),
  me: () => api<{ user: UserResponse['user'] }>('/auth/me'),
  forgotPassword: (email: string) => api<MessageResponse>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (body: ResetPasswordBody) => api<UserResponse>('/auth/reset-password', { method: 'POST', body }),
  /** Google nu se apelează cu fetch: se face navigare completă către acest URL. */
  googleUrl: `${API_URL}/auth/google`,
};
