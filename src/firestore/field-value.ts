import { encodeValue } from './serializer';
import { api } from './types';


export class FieldValue {
  static serverTimestamp() {
    return new FieldValue('setToServerValue', 'REQUEST_TIME');
  }

  static increment(value: number) {
    return new FieldValue('increment', value);
  }

  static maximum(value: number) {
    return new FieldValue('maximum', value);
  }

  static minimum(value: number) {
    return new FieldValue('minimum', value);
  }

  static appendMissingElements(value: any[]) {
    return new FieldValue('appendMissingElements', value);
  }

  static removeAllFromArray(value: any[]) {
    return new FieldValue('removeAllFromArray', value);
  }

  constructor(readonly transform: string, readonly value: any) {}

  encode(fieldPath: string): api.FieldTransform {
    const value = fieldPath === 'setToServerValue' ? this.value : encodeValue(this.value);
    return { fieldPath, [this.transform]: value };
  }
}

export class UpdateCollector {
  paths: string[] = [];
  mask: api.DocumentMask = { fieldPaths: [] };
  transforms: api.FieldTransform[] = [];

  transform(transform: FieldValue) {
    this.transforms.push(transform.encode(this.paths.join('.')));
  }

  enterField(field: string) {
    this.paths.push(field);
  }

  leaveField(addMask: boolean) {
    if (addMask) this.mask.fieldPaths.push(this.paths.join('.'));
    this.paths.pop();
  }

  removeField() {
    this.mask.fieldPaths.pop();
  }
}
