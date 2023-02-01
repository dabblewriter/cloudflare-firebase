import type { ServiceAccount, TokenGetter } from './types';
import jwt from '@tsndr/cloudflare-worker-jwt';

const exp = 3600;
const aud: Aud = {
  auth: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
  firestore: 'https://firestore.googleapis.com/google.firestore.v1.Firestore',
}


export function getTokenGetter(settings: ServiceAccount, service: keyof Aud): TokenGetter {
  let token: string;
  let tokenExp: number;

  return async function getToken(claims?: Record<string, any>) {
    if (!tokenExp || now() > tokenExp - 60) {
      token = await createToken(settings, service, claims);
      tokenExp = now() + exp;
    }
    return token;
  }
}

// Create firebase service account JWT to use in API calls
export async function createToken(serviceAccount: ServiceAccount, service: keyof Aud, claims?: Record<string, any>): Promise<string> {
  const iat = now();
  return await jwt.sign(
    {
      aud: aud[service],
      iss: serviceAccount.clientEmail,
      sub: claims.uid || serviceAccount.clientEmail,
      iat,
      exp: iat + exp,
      ...claims,
    },
    serviceAccount.privateKey,
    {
      algorithm: 'RS256', keyid: serviceAccount.privateKeyId
    }
  );
}

function now() {
  return Math.floor(Date.now() / 1000);
}

export interface Aud {
  auth: string;
  firestore: string;
}
