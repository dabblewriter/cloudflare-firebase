import { DocumentReference } from './reference';
import { decode, decodeValue } from './serializer';
import { docSymbol, readTimeSymbol } from './symbols';
import { api, DocumentData } from './types';


export class DocumentSnapshot<T = DocumentData> {

  constructor(readonly ref: DocumentReference<T>, doc: api.Document = { name: ref.qualifiedPath, fields: null }, readTime?: string) {
    this[docSymbol] = doc;
    this[readTimeSymbol] = readTime;
  }

  get createTime(): Date {
    return this[docSymbol].createTime && new Date(this[docSymbol].createTime);
  }

  get updateTime(): Date {
    return this[docSymbol].updateTime && new Date(this[docSymbol].updateTime);
  }

  get readTime(): Date {
    return this[readTimeSymbol] && new Date(this[readTimeSymbol]);
  }

  get exists() {
    return !!this[docSymbol].fields;
  }

  data() {
    return this[docSymbol].fields && decode(this.ref.firestore, this[docSymbol].fields) || null;
  }

  get(field: string): any {
    let fields: api.MapValue | api.Value | undefined = this[docSymbol].fields;
    const components = field.split('.');
    while (fields && components.length > 1) {
      fields = (fields as api.MapValue)[components.shift()]?.mapValue.fields;
    }
    const value = fields?.[components[0]];
    return value ? decodeValue(this.ref.firestore, value) : undefined;
  }
}
