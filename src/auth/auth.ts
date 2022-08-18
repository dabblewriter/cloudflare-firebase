import type { Settings } from '../types';
import { FirebaseService } from '../service';
import { SignInFirebaseResponse, SignInResponse, TokenResponse, Tokens, User } from './types';

const returnSecureToken = true; // used for adding boolean in requests

export class Auth extends FirebaseService {
  apiUrl: 'https://identitytoolkit.googleapis.com/v1/accounts';
  getToken: () => Promise<string>;

  constructor(settings: Settings, apiKey: string) {
    super('auth', 'https://identitytoolkit.googleapis.com/v1/accounts', settings, apiKey);
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<SignInResponse> {
    email = email && email.toLowerCase();
    const data = { email, password, returnSecureToken };
    const result: SignInFirebaseResponse = await this.request('POST', ':signInWithPassword', data);
    const tokens = convertSignInResponse(result);
    const user = await this._getUserData(tokens.idToken);
    return { user, tokens };
  }

  async refreshToken(token: string) {
    const data = { grant_type: 'refresh_token', refresh_token: token };
    const result: TokenResponse = await POST(`https://securetoken.googleapis.com/v1/token?key=${this.apiKey}`, data);
    const tokens: Tokens = {
      idToken: result.id_token,
      refreshToken: result.refresh_token,
    };
    return tokens;
  }

  private async _getUserData(idToken: string) {
    const response: any = await this.request('POST', ':lookup', { idToken });
    return convertUserData(response.users[0]);
  }
}


async function POST<T>(url: string, body: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json() as T;
  const error = (data as any)?.error as { code: number, message: string };
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

function convertUserData(user: any): User {
  let claims: Record<string, any> = {};

  if (user.customAttributes) {
    try {
      claims = JSON.parse(user.customAttributes);
    // tslint:disable-next-line:no-empty
    } catch (err) {}
  }

  return {
    uid: user.localId,
    name: user.displayName,
    email: user.email,
    emailVerified: user.emailVerified,
    photoUrl: user.photoUrl,
    passwordUpdatedAt: user.passwordUpdatedAt,
    claims,
    validSince: parseInt(user.validSince, 10),
    disabled: user.disabled,
    lastLoginAt: parseInt(user.lastLoginAt, 10),
    createdAt: parseInt(user.createdAt, 10),
  };
}

function convertSignInResponse(response: SignInFirebaseResponse): Tokens {
  const { idToken, refreshToken } = response;
  return { idToken, refreshToken };
}
