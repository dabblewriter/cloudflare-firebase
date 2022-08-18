import type { Settings, HTTPMethod } from '../types';
import type { api, ConsistencyOptions } from './types';
import { CollectionReference, DocumentReference } from './reference';
import { DocumentSnapshot } from './document';
import { WriteBatch } from './write-batch';
import { FirebaseService } from '../service';


export class Firestore extends FirebaseService {
  basePath: string;
  getToken: () => Promise<string>;

  constructor(settings: Settings, apiKey: string) {
    super('firestore', 'https://firestore.googleapis.com/v1', settings, apiKey);
    this.basePath = `projects/${settings.projectId}/databases/${settings.databaseId || '(default)'}/documents`;
  }

  collection(path: string): CollectionReference {
    return new CollectionReference(this, path);
  }

  doc(path: string): DocumentReference {
    return new DocumentReference(this, path);
  }

  batch(): WriteBatch {
    return new WriteBatch(this);
  }

  request<T>(method: HTTPMethod, path: string, search?: URLSearchParams, body?: object): Promise<T>;
  request<T>(method: HTTPMethod, path: string, body?: object): Promise<T>;
  async request<T>(method: HTTPMethod, path?: string, searchOrBody?: URLSearchParams | object, body?: object): Promise<T> {
    if (path && path[0] !== ':' && path[0] !== '/') path = '/' + path;
    path = this.basePath + path;
    return super.request(method, path, searchOrBody as URLSearchParams, body);
  }

  autoId(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    while (autoId.length < 20) {
      const bytes = crypto.getRandomValues(new Uint8Array(40));
      bytes.some(b => {
        // Length of `chars` is 62. We only take bytes between 0 and 62*4-1
        // (both inclusive). The value is then evenly mapped to indices of `char`
        // via a modulo operation.
        const maxValue = 62 * 4 - 1;
        if (b <= maxValue) {
          autoId += chars.charAt(b % 62);
        }
        if (autoId.length >= 20) return true;
      });
    }
    return autoId;
  }

  async batchGet(refs: DocumentReference[], fields?: string[], consistency?: ConsistencyOptions): Promise<DocumentSnapshot[]> {
    const mask = fields && { fieldPaths: fields };
    const request: api.BatchGetRequest = { documents: refs.map(ref => ref.qualifiedPath), mask, ...consistency };
    const response: api.BatchGetResponse[] = await this.request('POST', ':batchGet',  request);
    const docMap = new Map<string, api.BatchGetResponse>();
    // return in the same order as requested
    response.forEach(result => docMap.set(result.missing || result.found.name, result));
    return request.documents.map((name, i) => {
      const result = docMap.get(name);
      const doc = result.missing ? null : result.found;
      return new DocumentSnapshot(refs[i], doc, result.readTime);
    });
  }
}
