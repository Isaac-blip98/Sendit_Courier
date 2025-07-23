export interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
}
