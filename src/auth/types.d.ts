
export interface TokenPayload {
  // Custom data
  user_id: string;
  name: string;
  email: string;
  email_verified: boolean;

  iss: string; // Issuer
  aud: string; // Audience
  auth_time: string; // Time when auth occurred
  sub: string; // Subject (uid)
  iat: number; // Issued At
  exp: number; // Expiration
}

export interface TokenResponse {
  user_id: string;
  id_token: string;
  refresh_token: string;
}

export interface SignInFirebaseResponse {
  idToken:	string; // A Firebase Auth ID token for the authenticated user.
  email:	string; // The email for the authenticated user.
  refreshToken:	string; // A Firebase Auth refresh token for the authenticated user.
  expiresIn:	string; // The number of seconds in which the ID token expires.
  localId:	string; // The uid of the authenticated user.
}

export interface Tokens {
  idToken:	string; // A Firebase Auth ID token for the authenticated user.
  refreshToken:	string; // A Firebase Auth refresh token for the authenticated user.
  customToken?: string; // Signin by token token.
}

export interface SignInResponse {
  user: User;
  tokens: Tokens;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  emailVerified: boolean;
  photoUrl: string;
  passwordUpdatedAt: number;
  validSince: number;
  claims: Record<string, any>;
  disabled: boolean;
  lastLoginAt: number;
  createdAt: number;
}
