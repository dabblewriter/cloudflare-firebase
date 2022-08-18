import type { api, PartialWithFieldValue, SetOptions, UpdateData, WithFieldValue } from './types';
import { UpdateCollector } from './field-value';
import { Firestore } from './firestore';
import { DocumentReference } from './reference';
import { encode } from './serializer';


export class WriteBatch {
  private _writes: api.Write[] = [];

  constructor(readonly firestore: Firestore) {}

  get length() {
    return this._writes.length;
  }

  create<T>(ref: DocumentReference<T>, data: WithFieldValue<T>): this {
    return this._update(ref, data, UpdateType.create);
  }

  set<T>(ref: DocumentReference<T>, data: PartialWithFieldValue<T>, options: SetOptions): this;
  set<T>(ref: DocumentReference<T>, data: WithFieldValue<T>): this;
  set<T>(ref: DocumentReference<T>, data: PartialWithFieldValue<T>, options?: SetOptions): this {
    return this._update(ref, data, options?.merge ? UpdateType.update : UpdateType.set);
  }

  update<T>(ref: DocumentReference<T>, data: UpdateData<T>): this {
    return this._update(ref, data, UpdateType.update);
  }

  delete(ref: DocumentReference, precondition?: api.Precondition): this {
    this._writes.push({
      delete: ref.qualifiedPath,
      currentDocument: precondition
    });
    return this;
  }

  async commit(): Promise<Date[]> {
    Object.freeze(this._writes);
    const response = await this.firestore.request<api.BatchWriteResponse>('POST', ':batchWrite', { writes: this._writes });
    return response.writeResults.map(result => result.updateTime && new Date(result.updateTime) || undefined);
  }

  _update<T>(ref: DocumentReference, data: any, type: UpdateType): this {
    const collector = new UpdateCollector();
    const fields = encode(data, collector);

    if (!collector.mask.fieldPaths.length && type === UpdateType.update) {
      if (collector.transforms.length) {
        this._writes.push({
          transform: { document: ref.qualifiedPath, fieldTransforms: collector.transforms },
        });
      } else {
        // nothing changed, nothing to update, no-op
      }
    } else {
      const write: api.Write = {
        update: { name: ref.qualifiedPath, fields },
        updateMask: type === UpdateType.update ? collector.mask : undefined,
        updateTransforms: collector.transforms.length ? collector.transforms : undefined,
        currentDocument: type === UpdateType.create ? { exists: true } : undefined,
      };
      this._writes.push(write);
    }
    return this;
  }
}

enum UpdateType {
  create, set, update,
}
