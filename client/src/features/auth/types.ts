export type UserRole = 'CITIZEN' | 'STAFF' | 'ADMIN';

export type Membership = {
  id: string;
  role: 'HANDLER' | 'MANAGER';
  institution: { id: string; name: string; slug: string; type: string };
  department: { id: string; name: string } | null;
};

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  memberships?: Membership[]; // doar la GET /auth/me
};

export type LoginBody = { email: string; password: string };
export type RegisterBody = { name: string; email: string; password: string; phone?: string };
export type ResetPasswordBody = { token: string; password: string };

export type UserResponse = { message?: string; user: User };
export type MessageResponse = { message: string };
