import { UpdateCollector } from './field-value';
import { Firestore } from './firestore';
import { DocumentReference } from './reference';
import { encode } from './serializer';
import { updateSymbol, writesSymbol } from './symbols';
import type { DocumentData, PartialWithFieldValue, SetOptions, UpdateData, WithFieldValue, api } from './types';


export class WriteBatch {
  private [writesSymbol]: api.Write[] = [];

  constructor(readonly firestore: Firestore) {}

  get length() {
    return this[writesSymbol].length;
  }

  create<T = DocumentData>(ref: DocumentReference<T>, data: WithFieldValue<T>): this {
    return this[updateSymbol](ref, data, UpdateType.create);
  }

  set<T = DocumentData>(ref: DocumentReference<T>, data: PartialWithFieldValue<T>, options: SetOptions): this;
  set<T = DocumentData>(ref: DocumentReference<T>, data: WithFieldValue<T>): this;
  set<T = DocumentData>(ref: DocumentReference<T>, data: PartialWithFieldValue<T>, options?: SetOptions): this {
    return this[updateSymbol](ref, data, options?.merge ? UpdateType.update : UpdateType.set);
  }

  update<T = DocumentData>(ref: DocumentReference<T>, data: UpdateData<T>): this {
    return this[updateSymbol](ref, data, UpdateType.update);
  }

  delete<T = DocumentData>(ref: DocumentReference<T>, precondition?: api.Precondition): this {
    this[writesSymbol].push({
      delete: ref.qualifiedPath,
      currentDocument: precondition
    });
    return this;
  }

  async commit(): Promise<Date[]> {
    Object.freeze(this[writesSymbol]);
    if (this.firestore[writesSymbol]) { // transaction
      this.firestore[writesSymbol].push(...this[writesSymbol]);
      return;
    }
    const response = await this.firestore.request<api.BatchWriteResponse>('POST', ':batchWrite', { writes: this[writesSymbol] });
    return response.writeResults.map(result => result.updateTime && new Date(result.updateTime) || undefined);
  }

  [updateSymbol]<T = DocumentData>(ref: DocumentReference<T>, data: any, type: UpdateType): this {
    const collector = new UpdateCollector();
    const fields = encode(data, collector);

    if (!collector.mask.fieldPaths.length && type === UpdateType.update) {
      if (collector.transforms.length) {
        this[writesSymbol].push({
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
      this[writesSymbol].push(write);
    }
    return this;
  }
}

enum UpdateType {
  create, set, update,
}
