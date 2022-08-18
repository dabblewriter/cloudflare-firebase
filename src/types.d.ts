
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type TokenGetter = () => Promise<string>;

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
