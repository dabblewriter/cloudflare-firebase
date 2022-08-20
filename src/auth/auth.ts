import type { Settings } from '../types';
import type { SignInFirebaseResponse, SignInResponse, TokenResponse, Tokens, User } from './types';
import { FirebaseService } from '../service';
import jwt from '@tsndr/cloudflare-worker-jwt';

const returnSecureToken = true; // used for adding boolean in requests

export class Auth extends FirebaseService {
  apiUrl: 'https://identitytoolkit.googleapis.com/v1/accounts';
  getToken: () => Promise<string>;

  constructor(settings: Settings, apiKey: string) {
    super('auth', 'https://identitytoolkit.googleapis.com/v1/accounts', settings, apiKey);
  }

  async verify(token: string) {
    if (typeof token !== 'string') throw new Error('JWT token must be a string');
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) throw new Error('JWT token must consist of 3 parts');
    const { header: { alg, kid }, payload } = jwt.decode(token) as {header: any, payload: any};
    const importAlgorithm = (jwt as any).algorithms[alg];
    if (!importAlgorithm) throw new Error('JWT algorithm not found');
    if (payload.nbf && payload.nbf > Math.floor(Date.now() / 1000)) throw 'JWT token not yet valid';
    if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) throw 'JWT token expired';
    const jsonWebKey = await getPublicKey(kid);
    if (alg !== 'RS256' || !jsonWebKey || payload.iss !== `https://securetoken.google.com/${this.settings.projectId}`) throw new Error('JWT invalid');
    const key = await crypto.subtle.importKey('jwk', jsonWebKey, importAlgorithm, false, ['verify']);
    const verified = await crypto.subtle.verify(importAlgorithm, key, Base64URL.parse(tokenParts[2]), (jwt as any)._utf8ToUint8Array(`${tokenParts[0]}.${tokenParts[1]}`));
    if (!verified) throw new Error('JWT invalid');
    return payload;
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

let publicKeys: Record<string, JsonWebKey>;
async function getPublicKey(kid: string): Promise<JsonWebKey> {
  if (!publicKeys) {
    // Found this resource here https://stackoverflow.com/a/71988314/835542 since the documented one provides x509 certs, not directly useful
    const response = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
    const age = parseInt(response.headers.get('Cache-Control').replace(/^.*max-age=(\d+).*$/, '$1'));
    setTimeout(() => publicKeys = undefined, age * 1000);
    publicKeys = (await response.json() as any).keys.reduce((map, key) => (map[key.kid] = key) && map, {});
  }
  return publicKeys[kid];
}

class Base64URL {
  static parse(s: string) {
    return new Uint8Array(Array.prototype.map.call(atob(s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')), (c: string) => c.charCodeAt(0)));
  }
  static stringify(a: string) {
    return btoa(String.fromCharCode.apply(0, a)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
}
