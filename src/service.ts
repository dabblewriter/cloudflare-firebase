import type { HTTPMethod, ServiceAccount, Settings, UserAccount } from './types';
import { Aud, getTokenGetter } from './tokens';

export class FirebaseService {
  getToken: () => Promise<string>;

  constructor(service: keyof Aud, protected readonly apiUrl: string, protected readonly settings: Settings, protected readonly apiKey: string) {
    this.getToken = (settings as UserAccount).getToken || getTokenGetter(settings as ServiceAccount, service);
  }

  request<T>(method: HTTPMethod, path: string, search?: URLSearchParams, body?: object): Promise<T>;
  request<T>(method: HTTPMethod, path: string, body?: object): Promise<T>;
  async request<T>(method: HTTPMethod, path?: string, searchOrBody?: URLSearchParams | object, body?: object): Promise<T> {
    const searchParams = searchOrBody instanceof URLSearchParams ? searchOrBody : new URLSearchParams();
    searchParams.set('key', this.apiKey);
    if (!body && searchOrBody && !(searchOrBody instanceof URLSearchParams)) body = searchOrBody;
    if (path && path[0] !== ':' && path[0] !== '/') path = '/' + path;
    const response = await fetch(`${this.apiUrl}${path}?${searchParams}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return await response.json() as T;
  }

  userRequest<T>(method: HTTPMethod, path: string, search?: URLSearchParams, body?: object): Promise<T>;
  userRequest<T>(method: HTTPMethod, path: string, body?: object): Promise<T>;
  async userRequest<T>(method: HTTPMethod, path?: string, searchOrBody?: URLSearchParams | object, body?: object): Promise<T> {
    const searchParams = searchOrBody instanceof URLSearchParams ? searchOrBody : new URLSearchParams();
    searchParams.set('key', this.apiKey);
    if (!body && searchOrBody && !(searchOrBody instanceof URLSearchParams)) body = searchOrBody;
    if (path && path[0] !== ':' && path[0] !== '/') path = '/' + path;
    const response = await fetch(`${this.apiUrl}${path}?${searchParams}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json() as T;
  }
}
