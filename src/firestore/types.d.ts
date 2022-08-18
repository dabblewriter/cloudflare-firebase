/**
 * Document data (for use with `DocumentReference.set()`) consists of fields
 * mapped to values.
 */
export type DocumentData = {[field: string]: any};

/**
* Similar to Typescript's `Partial<T>`, but allows nested fields to be
* omitted and FieldValues to be passed in as property values.
*/
export type PartialWithFieldValue<T> =
  | Partial<T>
  | (T extends Primitive
      ? T
      : T extends {}
      ? {[K in keyof T]?: PartialWithFieldValue<T[K]> | FieldValue}
      : never);

/**
* Allows FieldValues to be passed in as a property value while maintaining
* type safety.
*/
export type WithFieldValue<T> =
  | T
  | (T extends Primitive
      ? T
      : T extends {}
      ? {[K in keyof T]: WithFieldValue<T[K]> | FieldValue}
      : never);

/**
* Update data (for use with [update]{@link DocumentReference#update})
* that contains paths mapped to values. Fields that contain dots reference
* nested fields within the document. FieldValues can be passed in
* as property values.
*
* You can update a top-level field in your document by using the field name
* as a key (e.g. `foo`). The provided value completely replaces the contents
* for this field.
*
* You can also update a nested field directly by using its field path as a
* key (e.g. `foo.bar`). This nested field update replaces the contents at
* `bar` but does not modify other data under `foo`.
*/
export type UpdateData<T> = T extends Primitive
  ? T
  : T extends {}
  ? {[K in keyof T]?: UpdateData<T[K]> | FieldValue} & NestedUpdateFields<T>
  : Partial<T>;

/** Primitive types. */
export type Primitive = string | number | boolean | undefined | null;

/**
* For each field (e.g. 'bar'), find all nested keys (e.g. {'bar.baz': T1,
* 'bar.qux': T2}). Intersect them together to make a single map containing
* all possible keys that are all marked as optional
*/
export type NestedUpdateFields<T extends Record<string, unknown>> =
  UnionToIntersection<
    {
      [K in keyof T & string]: ChildUpdateFields<K, T[K]>;
    }[keyof T & string] // Also include the generated prefix-string keys.
  >;

/**
* Helper for calculating the nested fields for a given type T1. This is needed
* to distribute union types such as `undefined | {...}` (happens for optional
* props) or `{a: A} | {b: B}`.
*
* In this use case, `V` is used to distribute the union types of `T[K]` on
* `Record`, since `T[K]` is evaluated as an expression and not distributed.
*
* See https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
*/
export type ChildUpdateFields<K extends string, V> =
  // Only allow nesting for map values
  V extends Record<string, unknown>
    ? // Recurse into the map and add the prefix in front of each key
      // (e.g. Prefix 'bar.' to create: 'bar.baz' and 'bar.qux'.
      AddPrefixToKeys<K, UpdateData<V>>
    : // UpdateData is always a map of values.
      never;

/**
* Returns a new map where every key is prefixed with the outer key appended
* to a dot.
*/
export type AddPrefixToKeys<
  Prefix extends string,
  T extends Record<string, unknown>
> =
  // Remap K => Prefix.K. See https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as
  {[K in keyof T & string as `${Prefix}.${K}`]+?: T[K]};

/**
* Given a union type `U = T1 | T2 | ...`, returns an intersected type
* `(T1 & T2 & ...)`.
*
* Uses distributive conditional types and inference from conditional types.
* This works because multiple candidates for the same type variable in
* contra-variant positions causes an intersection type to be inferred.
* https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-inference-in-conditional-types
* https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
*/
export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export class FieldValue {
  private constructor();

  /**
   * Returns a sentinel used with set(), create() or update() to include a
   * server-generated timestamp in the written data.
   *
   * @return The FieldValue sentinel for use in a call to set(), create() or
   * update().
   */
  static serverTimestamp(): FieldValue;

  /**
   * Returns a sentinel for use with update() or set() with {merge:true} to
   * mark a field for deletion.
   *
   * @return The FieldValue sentinel for use in a call to set() or update().
   */
  static delete(): FieldValue;

  /**
   * Returns a special value that can be used with set(), create() or update()
   * that tells the server to increment the field's current value by the given
   * value.
   *
   * If either current field value or the operand uses floating point
   * precision, both values will be interpreted as floating point numbers and
   * all arithmetic will follow IEEE 754 semantics. Otherwise, integer
   * precision is kept and the result is capped between -2^63 and 2^63-1.
   *
   * If the current field value is not of type 'number', or if the field does
   * not yet exist, the transformation will set the field to the given value.
   *
   * @param n The value to increment by.
   * @return The FieldValue sentinel for use in a call to set(), create() or
   * update().
   */
  static increment(n: number): FieldValue;

  /**
   * Returns a special value that can be used with set(), create() or update()
   * that tells the server to union the given elements with any array value
   * that already exists on the server. Each specified element that doesn't
   * already exist in the array will be added to the end. If the field being
   * modified is not already an array it will be overwritten with an array
   * containing exactly the specified elements.
   *
   * @param elements The elements to union into the array.
   * @return The FieldValue sentinel for use in a call to set(), create() or
   * update().
   */
  static arrayUnion(...elements: any[]): FieldValue;

  /**
   * Returns a special value that can be used with set(), create() or update()
   * that tells the server to remove the given elements from any array value
   * that already exists on the server. All instances of each element
   * specified will be removed from the array. If the field being modified is
   * not already an array it will be overwritten with an empty array.
   *
   * @param elements The elements to remove from the array.
   * @return The FieldValue sentinel for use in a call to set(), create() or
   * update().
   */
  static arrayRemove(...elements: any[]): FieldValue;

  /**
   * Returns true if this `FieldValue` is equal to the provided one.
   *
   * @param other The `FieldValue` to compare against.
   * @return true if this `FieldValue` is equal to the provided one.
   */
  isEqual(other: FieldValue): boolean;
}

export type SetOptions = { readonly merge?: boolean };

export type WhereFilterOp =
    | '<'
    | '<='
    | '=='
    | '!='
    | '>='
    | '>'
    | 'array-contains'
    | 'in'
    | 'not-in'
    | 'array-contains-any';


export type OrderByDirection = 'desc' | 'asc';

export interface ReadTransactionOptions {
  transaction?: string;
  readTime?: string;
}

export interface ReadOptions {
  readonly fieldMask?: string[];
}

export interface ConsistencyOptions {
  transaction?: string;
  newTransaction?: api.TransactionOptions;
  readTime?: string;
}

export namespace api {
  interface FieldsMapValue {
    fields: MapValue;
  }

  interface Value {
    nullValue?: null;
    booleanValue?: boolean;
    integerValue?: string;
    doubleValue?: number;
    timestampValue?: string;
    stringValue?: string;
    bytesValue?: string;
    referenceValue?: string;
    geoPointValue?: LatLng;
    arrayValue?: ArrayValue;
    mapValue?: FieldsMapValue;
  }

  interface ArrayValue {
    values: Value[];
  }

  interface MapValue {
    [key: string]: Value;
  }

  interface LatLng {
    latitude: number;
    longitude: number;
  }

  interface BatchGetRequest {
    documents: string[];
    mask?: DocumentMask;
    // Union field consistency_selector can be only one of the following:
    transaction?: string;
    newTransaction?: TransactionOptions;
    readTime?: string;
    // End of list of possible types for union field consistency_selector.
  }

  interface BatchGetResponse {
    transaction?: string,
    readTime: string,
    found?: Document;
    missing?: string;
  }

  interface BatchWriteRequest {
    writes: Write[];
    labels?: {[key: string]: string};
  }

  interface BatchWriteResponse {
    writeResults: WriteResult[];
    status: Status[];
  }

  interface BeginTransactionRequest {
    options: TransactionOptions;
  }

  interface BeginTransactionResponse {
    transaction: string;
  }

  interface CommitRequest {
    writes: Write[];
    transaction: string;
  }

  interface CommitResponse {
    writeResults: WriteResult[];
    commitTime: string;
  }

  interface Write {
    updateMask?: DocumentMask;
    updateTransforms?: FieldTransform[];
    currentDocument?: Precondition;

    // Union field operation can be only one of the following:
    update?: Document;
    delete?: string;
    transform?: DocumentTransform;
    // End of list of possible types for union field operation.
  }

  interface FieldTransform {
    fieldPath: string;
    // Union field transform_type can be only one of the following:
    setToServerValue?: ServerValue;
    increment?: Value;
    maximum?: Value;
    minimum?: Value;
    appendMissingElements?: ArrayValue;
    removeAllFromArray?: ArrayValue;
    // End of list of possible types for union field transform_type.
  }

  interface FieldReference {
    fieldPath?: string;
  }

  interface Filter {
    compositeFilter?: CompositeFilter;
    fieldFilter?: FieldFilter;
    unaryFilter?: UnaryFilter;
  }

  interface CompositeFilter {
    op?: CompositeFilterOperator;
    filters?: Filter[];
  }

  interface FieldFilter {
    field?: FieldReference;
    op?: FieldFilterOperator;
    value?: Value;
  }

  interface UnaryFilter {
    op?: UnaryFilterOperator;
    field?: FieldReference;
  }

  interface CollectionSelector {
    collectionId: string,
    allDescendants?: boolean
  }

  interface Cursor {
    values: Value[];
    before?: boolean;
  }

  interface StructuredQuery {
    select?: StructuredQueryProjection;
    from?: [CollectionSelector],
    where?: Filter;
    orderBy?: StructuredQueryOrder[],
    startAt?: Cursor;
    endAt?: Cursor;
    offset?: number;
    limit?: number;
  }

  interface StructuredQueryOrder {
    field?: FieldReference;
    direction?: StructuredQueryDirection;
  }

  interface StructuredQueryProjection {
    fields?: FieldReference[];
  }

  interface StructuredQueryOrder {
    field?: FieldReference;
    direction?: StructuredQueryDirection;
  }

  type CompositeFilterOperator = 'OPERATOR_UNSPECIFIED'| 'AND';
  type FieldFilterOperator = 'OPERATOR_UNSPECIFIED'| 'LESS_THAN'| 'LESS_THAN_OR_EQUAL'| 'GREATER_THAN'| 'GREATER_THAN_OR_EQUAL'| 'EQUAL'| 'NOT_EQUAL'| 'ARRAY_CONTAINS'| 'IN'| 'ARRAY_CONTAINS_ANY'| 'NOT_IN';
  type UnaryFilterOperator = 'OPERATOR_UNSPECIFIED'| 'IS_NAN'| 'IS_NULL'| 'IS_NOT_NAN'| 'IS_NOT_NULL';
  type StructuredQueryDirection = 'DIRECTION_UNSPECIFIED'| 'ASCENDING'| 'DESCENDING';

  enum ServerValue {
    SERVER_VALUE_UNSPECIFIED = 'SERVER_VALUE_UNSPECIFIED',
    REQUEST_TIME = 'REQUEST_TIME',
  }

  interface Document {
    name: string,
    fields: MapValue,
    createTime?: string,
    updateTime?: string
  }

  interface DocumentMask {
    fieldPaths: string[];
  }

  interface TransactionOptions {
    // Union field mode can be only one of the following:
    readOnly?: ReadOnly;
    readWrite?: ReadWrite;
    // End of list of possible types for union field mode.
  }

  interface ReadOnly {
    readTime: string;
  }

  interface ReadWrite {
    retryTransaction: string;
  }

  interface Precondition {
    // Union field condition_type can be only one of the following:
    exists?: boolean;
    updateTime?: string;
    // End of list of possible types for union field condition_type.
  }

  interface DocumentTransform {
    document: string;
    fieldTransforms: FieldTransform[];
  }

  interface WriteResult {
    updateTime?: string;
    transformResults?: Value[];
  }

  interface ListCollectionIdsResponse {
    collectionIds: string[];
    nextPageToken?: string;
  }

  interface ListDocumentsResponse {
    documents: Document[];
    nextPageToken?: string;
  }

  interface RunQueryResponse {
    error?: { code: number; message: string; status: string; };
    transaction?: string;
    document?: Document;
    readTime: string;
    skippedResults?: number;
    done?: boolean;
  }

  interface Status {
    code: number;
    message: string;
    details:{
      '@type': string;
      [key: string]: any;
    }[];
  }
}



