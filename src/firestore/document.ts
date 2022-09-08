import { DocumentReference } from './reference';
import { decode, decodeValue } from './serializer';
import { api, DocumentData } from './types';


export class DocumentSnapshot<T = DocumentData> {

  constructor(readonly ref: DocumentReference<T>, private _doc: api.Document = { name: ref.qualifiedPath, fields: null }, private _readTime?: string) {
  }

  get createTime(): Date {
    return this._doc.createTime && new Date(this._doc.createTime);
  }

  get updateTime(): Date {
    return this._doc.updateTime && new Date(this._doc.updateTime);
  }

  get readTime(): Date {
    return this._readTime && new Date(this._readTime);
  }

  get exists() {
    return !!this._doc.fields;
  }

  data() {
    return this._doc.fields && decode(this.ref.firestore, this._doc.fields) || null;
  }

  get(field: string): any {
    let fields: api.MapValue | api.Value | undefined = this._doc.fields;
    const components = field.split('.');
    while (fields && components.length > 1) {
      fields = (fields as api.MapValue)[components.shift()]?.mapValue.fields;
    }
    const value = fields?.[components[0]];
    return value ? decodeValue(this.ref.firestore, value) : undefined;
  }
}
