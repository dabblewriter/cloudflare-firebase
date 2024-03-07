export * from './auth/types';
export * from './firestore/types';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type TokenGetter = (claims?: Record<string, any>) => Promise<string>;
export type OauthTokenGetter = (scope: string) => Promise<string>;

export interface ServiceAccount {
  projectId: string;
  databaseId?: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
}

export interface UserAccount {
  getToken: TokenGetter;
  getOauthToken: OauthTokenGetter;
  projectId: string;
  databaseId?: string;
}

export type Settings = ServiceAccount | UserAccount;
