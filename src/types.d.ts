export * from './auth/types';
export * from './firestore/types';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type TokenGetter = (claims?: object) => Promise<string>;

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
  projectId: string;
  databaseId?: string;
}

export type Settings = ServiceAccount | UserAccount;
