
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model DataSource
 * 
 */
export type DataSource = $Result.DefaultSelection<Prisma.$DataSourcePayload>
/**
 * Model Snapshot
 * 
 */
export type Snapshot = $Result.DefaultSelection<Prisma.$SnapshotPayload>
/**
 * Model Relationship
 * 
 */
export type Relationship = $Result.DefaultSelection<Prisma.$RelationshipPayload>
/**
 * Model ConsolidatedModel
 * 
 */
export type ConsolidatedModel = $Result.DefaultSelection<Prisma.$ConsolidatedModelPayload>
/**
 * Model ImportHistory
 * 
 */
export type ImportHistory = $Result.DefaultSelection<Prisma.$ImportHistoryPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more DataSources
 * const dataSources = await prisma.dataSource.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more DataSources
   * const dataSources = await prisma.dataSource.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.dataSource`: Exposes CRUD operations for the **DataSource** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DataSources
    * const dataSources = await prisma.dataSource.findMany()
    * ```
    */
  get dataSource(): Prisma.DataSourceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.snapshot`: Exposes CRUD operations for the **Snapshot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Snapshots
    * const snapshots = await prisma.snapshot.findMany()
    * ```
    */
  get snapshot(): Prisma.SnapshotDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.relationship`: Exposes CRUD operations for the **Relationship** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Relationships
    * const relationships = await prisma.relationship.findMany()
    * ```
    */
  get relationship(): Prisma.RelationshipDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.consolidatedModel`: Exposes CRUD operations for the **ConsolidatedModel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ConsolidatedModels
    * const consolidatedModels = await prisma.consolidatedModel.findMany()
    * ```
    */
  get consolidatedModel(): Prisma.ConsolidatedModelDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.importHistory`: Exposes CRUD operations for the **ImportHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ImportHistories
    * const importHistories = await prisma.importHistory.findMany()
    * ```
    */
  get importHistory(): Prisma.ImportHistoryDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.16.2
   * Query Engine version: 1c57fdcd7e44b29b9313256c76699e91c3ac3c43
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    DataSource: 'DataSource',
    Snapshot: 'Snapshot',
    Relationship: 'Relationship',
    ConsolidatedModel: 'ConsolidatedModel',
    ImportHistory: 'ImportHistory'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "dataSource" | "snapshot" | "relationship" | "consolidatedModel" | "importHistory"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      DataSource: {
        payload: Prisma.$DataSourcePayload<ExtArgs>
        fields: Prisma.DataSourceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DataSourceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DataSourceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload>
          }
          findFirst: {
            args: Prisma.DataSourceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DataSourceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload>
          }
          findMany: {
            args: Prisma.DataSourceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload>[]
          }
          create: {
            args: Prisma.DataSourceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload>
          }
          createMany: {
            args: Prisma.DataSourceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DataSourceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload>[]
          }
          delete: {
            args: Prisma.DataSourceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload>
          }
          update: {
            args: Prisma.DataSourceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload>
          }
          deleteMany: {
            args: Prisma.DataSourceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DataSourceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DataSourceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload>[]
          }
          upsert: {
            args: Prisma.DataSourceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DataSourcePayload>
          }
          aggregate: {
            args: Prisma.DataSourceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDataSource>
          }
          groupBy: {
            args: Prisma.DataSourceGroupByArgs<ExtArgs>
            result: $Utils.Optional<DataSourceGroupByOutputType>[]
          }
          count: {
            args: Prisma.DataSourceCountArgs<ExtArgs>
            result: $Utils.Optional<DataSourceCountAggregateOutputType> | number
          }
        }
      }
      Snapshot: {
        payload: Prisma.$SnapshotPayload<ExtArgs>
        fields: Prisma.SnapshotFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SnapshotFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SnapshotFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload>
          }
          findFirst: {
            args: Prisma.SnapshotFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SnapshotFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload>
          }
          findMany: {
            args: Prisma.SnapshotFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload>[]
          }
          create: {
            args: Prisma.SnapshotCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload>
          }
          createMany: {
            args: Prisma.SnapshotCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SnapshotCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload>[]
          }
          delete: {
            args: Prisma.SnapshotDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload>
          }
          update: {
            args: Prisma.SnapshotUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload>
          }
          deleteMany: {
            args: Prisma.SnapshotDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SnapshotUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SnapshotUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload>[]
          }
          upsert: {
            args: Prisma.SnapshotUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SnapshotPayload>
          }
          aggregate: {
            args: Prisma.SnapshotAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSnapshot>
          }
          groupBy: {
            args: Prisma.SnapshotGroupByArgs<ExtArgs>
            result: $Utils.Optional<SnapshotGroupByOutputType>[]
          }
          count: {
            args: Prisma.SnapshotCountArgs<ExtArgs>
            result: $Utils.Optional<SnapshotCountAggregateOutputType> | number
          }
        }
      }
      Relationship: {
        payload: Prisma.$RelationshipPayload<ExtArgs>
        fields: Prisma.RelationshipFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RelationshipFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RelationshipFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload>
          }
          findFirst: {
            args: Prisma.RelationshipFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RelationshipFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload>
          }
          findMany: {
            args: Prisma.RelationshipFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload>[]
          }
          create: {
            args: Prisma.RelationshipCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload>
          }
          createMany: {
            args: Prisma.RelationshipCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RelationshipCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload>[]
          }
          delete: {
            args: Prisma.RelationshipDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload>
          }
          update: {
            args: Prisma.RelationshipUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload>
          }
          deleteMany: {
            args: Prisma.RelationshipDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RelationshipUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RelationshipUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload>[]
          }
          upsert: {
            args: Prisma.RelationshipUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipPayload>
          }
          aggregate: {
            args: Prisma.RelationshipAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRelationship>
          }
          groupBy: {
            args: Prisma.RelationshipGroupByArgs<ExtArgs>
            result: $Utils.Optional<RelationshipGroupByOutputType>[]
          }
          count: {
            args: Prisma.RelationshipCountArgs<ExtArgs>
            result: $Utils.Optional<RelationshipCountAggregateOutputType> | number
          }
        }
      }
      ConsolidatedModel: {
        payload: Prisma.$ConsolidatedModelPayload<ExtArgs>
        fields: Prisma.ConsolidatedModelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConsolidatedModelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConsolidatedModelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload>
          }
          findFirst: {
            args: Prisma.ConsolidatedModelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConsolidatedModelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload>
          }
          findMany: {
            args: Prisma.ConsolidatedModelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload>[]
          }
          create: {
            args: Prisma.ConsolidatedModelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload>
          }
          createMany: {
            args: Prisma.ConsolidatedModelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConsolidatedModelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload>[]
          }
          delete: {
            args: Prisma.ConsolidatedModelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload>
          }
          update: {
            args: Prisma.ConsolidatedModelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload>
          }
          deleteMany: {
            args: Prisma.ConsolidatedModelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConsolidatedModelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ConsolidatedModelUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload>[]
          }
          upsert: {
            args: Prisma.ConsolidatedModelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsolidatedModelPayload>
          }
          aggregate: {
            args: Prisma.ConsolidatedModelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConsolidatedModel>
          }
          groupBy: {
            args: Prisma.ConsolidatedModelGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConsolidatedModelGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConsolidatedModelCountArgs<ExtArgs>
            result: $Utils.Optional<ConsolidatedModelCountAggregateOutputType> | number
          }
        }
      }
      ImportHistory: {
        payload: Prisma.$ImportHistoryPayload<ExtArgs>
        fields: Prisma.ImportHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ImportHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ImportHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload>
          }
          findFirst: {
            args: Prisma.ImportHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ImportHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload>
          }
          findMany: {
            args: Prisma.ImportHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload>[]
          }
          create: {
            args: Prisma.ImportHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload>
          }
          createMany: {
            args: Prisma.ImportHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ImportHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload>[]
          }
          delete: {
            args: Prisma.ImportHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload>
          }
          update: {
            args: Prisma.ImportHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload>
          }
          deleteMany: {
            args: Prisma.ImportHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ImportHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ImportHistoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload>[]
          }
          upsert: {
            args: Prisma.ImportHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ImportHistoryPayload>
          }
          aggregate: {
            args: Prisma.ImportHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateImportHistory>
          }
          groupBy: {
            args: Prisma.ImportHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<ImportHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.ImportHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<ImportHistoryCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    dataSource?: DataSourceOmit
    snapshot?: SnapshotOmit
    relationship?: RelationshipOmit
    consolidatedModel?: ConsolidatedModelOmit
    importHistory?: ImportHistoryOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type DataSourceCountOutputType
   */

  export type DataSourceCountOutputType = {
    snapshots: number
    relationships: number
    targetRelationships: number
  }

  export type DataSourceCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    snapshots?: boolean | DataSourceCountOutputTypeCountSnapshotsArgs
    relationships?: boolean | DataSourceCountOutputTypeCountRelationshipsArgs
    targetRelationships?: boolean | DataSourceCountOutputTypeCountTargetRelationshipsArgs
  }

  // Custom InputTypes
  /**
   * DataSourceCountOutputType without action
   */
  export type DataSourceCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSourceCountOutputType
     */
    select?: DataSourceCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DataSourceCountOutputType without action
   */
  export type DataSourceCountOutputTypeCountSnapshotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SnapshotWhereInput
  }

  /**
   * DataSourceCountOutputType without action
   */
  export type DataSourceCountOutputTypeCountRelationshipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RelationshipWhereInput
  }

  /**
   * DataSourceCountOutputType without action
   */
  export type DataSourceCountOutputTypeCountTargetRelationshipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RelationshipWhereInput
  }


  /**
   * Models
   */

  /**
   * Model DataSource
   */

  export type AggregateDataSource = {
    _count: DataSourceCountAggregateOutputType | null
    _min: DataSourceMinAggregateOutputType | null
    _max: DataSourceMaxAggregateOutputType | null
  }

  export type DataSourceMinAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    config: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
    lastSyncAt: Date | null
  }

  export type DataSourceMaxAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    config: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
    lastSyncAt: Date | null
  }

  export type DataSourceCountAggregateOutputType = {
    id: number
    name: number
    type: number
    config: number
    status: number
    createdAt: number
    updatedAt: number
    lastSyncAt: number
    _all: number
  }


  export type DataSourceMinAggregateInputType = {
    id?: true
    name?: true
    type?: true
    config?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    lastSyncAt?: true
  }

  export type DataSourceMaxAggregateInputType = {
    id?: true
    name?: true
    type?: true
    config?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    lastSyncAt?: true
  }

  export type DataSourceCountAggregateInputType = {
    id?: true
    name?: true
    type?: true
    config?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    lastSyncAt?: true
    _all?: true
  }

  export type DataSourceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DataSource to aggregate.
     */
    where?: DataSourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DataSources to fetch.
     */
    orderBy?: DataSourceOrderByWithRelationInput | DataSourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DataSourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DataSources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DataSources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DataSources
    **/
    _count?: true | DataSourceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DataSourceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DataSourceMaxAggregateInputType
  }

  export type GetDataSourceAggregateType<T extends DataSourceAggregateArgs> = {
        [P in keyof T & keyof AggregateDataSource]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDataSource[P]>
      : GetScalarType<T[P], AggregateDataSource[P]>
  }




  export type DataSourceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DataSourceWhereInput
    orderBy?: DataSourceOrderByWithAggregationInput | DataSourceOrderByWithAggregationInput[]
    by: DataSourceScalarFieldEnum[] | DataSourceScalarFieldEnum
    having?: DataSourceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DataSourceCountAggregateInputType | true
    _min?: DataSourceMinAggregateInputType
    _max?: DataSourceMaxAggregateInputType
  }

  export type DataSourceGroupByOutputType = {
    id: string
    name: string
    type: string
    config: string
    status: string
    createdAt: Date
    updatedAt: Date
    lastSyncAt: Date | null
    _count: DataSourceCountAggregateOutputType | null
    _min: DataSourceMinAggregateOutputType | null
    _max: DataSourceMaxAggregateOutputType | null
  }

  type GetDataSourceGroupByPayload<T extends DataSourceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DataSourceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DataSourceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DataSourceGroupByOutputType[P]>
            : GetScalarType<T[P], DataSourceGroupByOutputType[P]>
        }
      >
    >


  export type DataSourceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    config?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastSyncAt?: boolean
    snapshots?: boolean | DataSource$snapshotsArgs<ExtArgs>
    relationships?: boolean | DataSource$relationshipsArgs<ExtArgs>
    targetRelationships?: boolean | DataSource$targetRelationshipsArgs<ExtArgs>
    _count?: boolean | DataSourceCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["dataSource"]>

  export type DataSourceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    config?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastSyncAt?: boolean
  }, ExtArgs["result"]["dataSource"]>

  export type DataSourceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    config?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastSyncAt?: boolean
  }, ExtArgs["result"]["dataSource"]>

  export type DataSourceSelectScalar = {
    id?: boolean
    name?: boolean
    type?: boolean
    config?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastSyncAt?: boolean
  }

  export type DataSourceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "type" | "config" | "status" | "createdAt" | "updatedAt" | "lastSyncAt", ExtArgs["result"]["dataSource"]>
  export type DataSourceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    snapshots?: boolean | DataSource$snapshotsArgs<ExtArgs>
    relationships?: boolean | DataSource$relationshipsArgs<ExtArgs>
    targetRelationships?: boolean | DataSource$targetRelationshipsArgs<ExtArgs>
    _count?: boolean | DataSourceCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DataSourceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type DataSourceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $DataSourcePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DataSource"
    objects: {
      snapshots: Prisma.$SnapshotPayload<ExtArgs>[]
      relationships: Prisma.$RelationshipPayload<ExtArgs>[]
      targetRelationships: Prisma.$RelationshipPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      type: string
      config: string
      status: string
      createdAt: Date
      updatedAt: Date
      lastSyncAt: Date | null
    }, ExtArgs["result"]["dataSource"]>
    composites: {}
  }

  type DataSourceGetPayload<S extends boolean | null | undefined | DataSourceDefaultArgs> = $Result.GetResult<Prisma.$DataSourcePayload, S>

  type DataSourceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DataSourceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DataSourceCountAggregateInputType | true
    }

  export interface DataSourceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DataSource'], meta: { name: 'DataSource' } }
    /**
     * Find zero or one DataSource that matches the filter.
     * @param {DataSourceFindUniqueArgs} args - Arguments to find a DataSource
     * @example
     * // Get one DataSource
     * const dataSource = await prisma.dataSource.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DataSourceFindUniqueArgs>(args: SelectSubset<T, DataSourceFindUniqueArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one DataSource that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DataSourceFindUniqueOrThrowArgs} args - Arguments to find a DataSource
     * @example
     * // Get one DataSource
     * const dataSource = await prisma.dataSource.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DataSourceFindUniqueOrThrowArgs>(args: SelectSubset<T, DataSourceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DataSource that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DataSourceFindFirstArgs} args - Arguments to find a DataSource
     * @example
     * // Get one DataSource
     * const dataSource = await prisma.dataSource.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DataSourceFindFirstArgs>(args?: SelectSubset<T, DataSourceFindFirstArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DataSource that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DataSourceFindFirstOrThrowArgs} args - Arguments to find a DataSource
     * @example
     * // Get one DataSource
     * const dataSource = await prisma.dataSource.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DataSourceFindFirstOrThrowArgs>(args?: SelectSubset<T, DataSourceFindFirstOrThrowArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more DataSources that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DataSourceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DataSources
     * const dataSources = await prisma.dataSource.findMany()
     * 
     * // Get first 10 DataSources
     * const dataSources = await prisma.dataSource.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const dataSourceWithIdOnly = await prisma.dataSource.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DataSourceFindManyArgs>(args?: SelectSubset<T, DataSourceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a DataSource.
     * @param {DataSourceCreateArgs} args - Arguments to create a DataSource.
     * @example
     * // Create one DataSource
     * const DataSource = await prisma.dataSource.create({
     *   data: {
     *     // ... data to create a DataSource
     *   }
     * })
     * 
     */
    create<T extends DataSourceCreateArgs>(args: SelectSubset<T, DataSourceCreateArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many DataSources.
     * @param {DataSourceCreateManyArgs} args - Arguments to create many DataSources.
     * @example
     * // Create many DataSources
     * const dataSource = await prisma.dataSource.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DataSourceCreateManyArgs>(args?: SelectSubset<T, DataSourceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DataSources and returns the data saved in the database.
     * @param {DataSourceCreateManyAndReturnArgs} args - Arguments to create many DataSources.
     * @example
     * // Create many DataSources
     * const dataSource = await prisma.dataSource.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DataSources and only return the `id`
     * const dataSourceWithIdOnly = await prisma.dataSource.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DataSourceCreateManyAndReturnArgs>(args?: SelectSubset<T, DataSourceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a DataSource.
     * @param {DataSourceDeleteArgs} args - Arguments to delete one DataSource.
     * @example
     * // Delete one DataSource
     * const DataSource = await prisma.dataSource.delete({
     *   where: {
     *     // ... filter to delete one DataSource
     *   }
     * })
     * 
     */
    delete<T extends DataSourceDeleteArgs>(args: SelectSubset<T, DataSourceDeleteArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one DataSource.
     * @param {DataSourceUpdateArgs} args - Arguments to update one DataSource.
     * @example
     * // Update one DataSource
     * const dataSource = await prisma.dataSource.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DataSourceUpdateArgs>(args: SelectSubset<T, DataSourceUpdateArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more DataSources.
     * @param {DataSourceDeleteManyArgs} args - Arguments to filter DataSources to delete.
     * @example
     * // Delete a few DataSources
     * const { count } = await prisma.dataSource.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DataSourceDeleteManyArgs>(args?: SelectSubset<T, DataSourceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DataSources.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DataSourceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DataSources
     * const dataSource = await prisma.dataSource.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DataSourceUpdateManyArgs>(args: SelectSubset<T, DataSourceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DataSources and returns the data updated in the database.
     * @param {DataSourceUpdateManyAndReturnArgs} args - Arguments to update many DataSources.
     * @example
     * // Update many DataSources
     * const dataSource = await prisma.dataSource.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more DataSources and only return the `id`
     * const dataSourceWithIdOnly = await prisma.dataSource.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DataSourceUpdateManyAndReturnArgs>(args: SelectSubset<T, DataSourceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one DataSource.
     * @param {DataSourceUpsertArgs} args - Arguments to update or create a DataSource.
     * @example
     * // Update or create a DataSource
     * const dataSource = await prisma.dataSource.upsert({
     *   create: {
     *     // ... data to create a DataSource
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DataSource we want to update
     *   }
     * })
     */
    upsert<T extends DataSourceUpsertArgs>(args: SelectSubset<T, DataSourceUpsertArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of DataSources.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DataSourceCountArgs} args - Arguments to filter DataSources to count.
     * @example
     * // Count the number of DataSources
     * const count = await prisma.dataSource.count({
     *   where: {
     *     // ... the filter for the DataSources we want to count
     *   }
     * })
    **/
    count<T extends DataSourceCountArgs>(
      args?: Subset<T, DataSourceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DataSourceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DataSource.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DataSourceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DataSourceAggregateArgs>(args: Subset<T, DataSourceAggregateArgs>): Prisma.PrismaPromise<GetDataSourceAggregateType<T>>

    /**
     * Group by DataSource.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DataSourceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DataSourceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DataSourceGroupByArgs['orderBy'] }
        : { orderBy?: DataSourceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DataSourceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDataSourceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DataSource model
   */
  readonly fields: DataSourceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DataSource.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DataSourceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    snapshots<T extends DataSource$snapshotsArgs<ExtArgs> = {}>(args?: Subset<T, DataSource$snapshotsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    relationships<T extends DataSource$relationshipsArgs<ExtArgs> = {}>(args?: Subset<T, DataSource$relationshipsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    targetRelationships<T extends DataSource$targetRelationshipsArgs<ExtArgs> = {}>(args?: Subset<T, DataSource$targetRelationshipsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DataSource model
   */
  interface DataSourceFieldRefs {
    readonly id: FieldRef<"DataSource", 'String'>
    readonly name: FieldRef<"DataSource", 'String'>
    readonly type: FieldRef<"DataSource", 'String'>
    readonly config: FieldRef<"DataSource", 'String'>
    readonly status: FieldRef<"DataSource", 'String'>
    readonly createdAt: FieldRef<"DataSource", 'DateTime'>
    readonly updatedAt: FieldRef<"DataSource", 'DateTime'>
    readonly lastSyncAt: FieldRef<"DataSource", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DataSource findUnique
   */
  export type DataSourceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
    /**
     * Filter, which DataSource to fetch.
     */
    where: DataSourceWhereUniqueInput
  }

  /**
   * DataSource findUniqueOrThrow
   */
  export type DataSourceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
    /**
     * Filter, which DataSource to fetch.
     */
    where: DataSourceWhereUniqueInput
  }

  /**
   * DataSource findFirst
   */
  export type DataSourceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
    /**
     * Filter, which DataSource to fetch.
     */
    where?: DataSourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DataSources to fetch.
     */
    orderBy?: DataSourceOrderByWithRelationInput | DataSourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DataSources.
     */
    cursor?: DataSourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DataSources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DataSources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DataSources.
     */
    distinct?: DataSourceScalarFieldEnum | DataSourceScalarFieldEnum[]
  }

  /**
   * DataSource findFirstOrThrow
   */
  export type DataSourceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
    /**
     * Filter, which DataSource to fetch.
     */
    where?: DataSourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DataSources to fetch.
     */
    orderBy?: DataSourceOrderByWithRelationInput | DataSourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DataSources.
     */
    cursor?: DataSourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DataSources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DataSources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DataSources.
     */
    distinct?: DataSourceScalarFieldEnum | DataSourceScalarFieldEnum[]
  }

  /**
   * DataSource findMany
   */
  export type DataSourceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
    /**
     * Filter, which DataSources to fetch.
     */
    where?: DataSourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DataSources to fetch.
     */
    orderBy?: DataSourceOrderByWithRelationInput | DataSourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DataSources.
     */
    cursor?: DataSourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DataSources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DataSources.
     */
    skip?: number
    distinct?: DataSourceScalarFieldEnum | DataSourceScalarFieldEnum[]
  }

  /**
   * DataSource create
   */
  export type DataSourceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
    /**
     * The data needed to create a DataSource.
     */
    data: XOR<DataSourceCreateInput, DataSourceUncheckedCreateInput>
  }

  /**
   * DataSource createMany
   */
  export type DataSourceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DataSources.
     */
    data: DataSourceCreateManyInput | DataSourceCreateManyInput[]
  }

  /**
   * DataSource createManyAndReturn
   */
  export type DataSourceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * The data used to create many DataSources.
     */
    data: DataSourceCreateManyInput | DataSourceCreateManyInput[]
  }

  /**
   * DataSource update
   */
  export type DataSourceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
    /**
     * The data needed to update a DataSource.
     */
    data: XOR<DataSourceUpdateInput, DataSourceUncheckedUpdateInput>
    /**
     * Choose, which DataSource to update.
     */
    where: DataSourceWhereUniqueInput
  }

  /**
   * DataSource updateMany
   */
  export type DataSourceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DataSources.
     */
    data: XOR<DataSourceUpdateManyMutationInput, DataSourceUncheckedUpdateManyInput>
    /**
     * Filter which DataSources to update
     */
    where?: DataSourceWhereInput
    /**
     * Limit how many DataSources to update.
     */
    limit?: number
  }

  /**
   * DataSource updateManyAndReturn
   */
  export type DataSourceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * The data used to update DataSources.
     */
    data: XOR<DataSourceUpdateManyMutationInput, DataSourceUncheckedUpdateManyInput>
    /**
     * Filter which DataSources to update
     */
    where?: DataSourceWhereInput
    /**
     * Limit how many DataSources to update.
     */
    limit?: number
  }

  /**
   * DataSource upsert
   */
  export type DataSourceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
    /**
     * The filter to search for the DataSource to update in case it exists.
     */
    where: DataSourceWhereUniqueInput
    /**
     * In case the DataSource found by the `where` argument doesn't exist, create a new DataSource with this data.
     */
    create: XOR<DataSourceCreateInput, DataSourceUncheckedCreateInput>
    /**
     * In case the DataSource was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DataSourceUpdateInput, DataSourceUncheckedUpdateInput>
  }

  /**
   * DataSource delete
   */
  export type DataSourceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
    /**
     * Filter which DataSource to delete.
     */
    where: DataSourceWhereUniqueInput
  }

  /**
   * DataSource deleteMany
   */
  export type DataSourceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DataSources to delete
     */
    where?: DataSourceWhereInput
    /**
     * Limit how many DataSources to delete.
     */
    limit?: number
  }

  /**
   * DataSource.snapshots
   */
  export type DataSource$snapshotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    where?: SnapshotWhereInput
    orderBy?: SnapshotOrderByWithRelationInput | SnapshotOrderByWithRelationInput[]
    cursor?: SnapshotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SnapshotScalarFieldEnum | SnapshotScalarFieldEnum[]
  }

  /**
   * DataSource.relationships
   */
  export type DataSource$relationshipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    where?: RelationshipWhereInput
    orderBy?: RelationshipOrderByWithRelationInput | RelationshipOrderByWithRelationInput[]
    cursor?: RelationshipWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RelationshipScalarFieldEnum | RelationshipScalarFieldEnum[]
  }

  /**
   * DataSource.targetRelationships
   */
  export type DataSource$targetRelationshipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    where?: RelationshipWhereInput
    orderBy?: RelationshipOrderByWithRelationInput | RelationshipOrderByWithRelationInput[]
    cursor?: RelationshipWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RelationshipScalarFieldEnum | RelationshipScalarFieldEnum[]
  }

  /**
   * DataSource without action
   */
  export type DataSourceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DataSource
     */
    select?: DataSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DataSource
     */
    omit?: DataSourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DataSourceInclude<ExtArgs> | null
  }


  /**
   * Model Snapshot
   */

  export type AggregateSnapshot = {
    _count: SnapshotCountAggregateOutputType | null
    _avg: SnapshotAvgAggregateOutputType | null
    _sum: SnapshotSumAggregateOutputType | null
    _min: SnapshotMinAggregateOutputType | null
    _max: SnapshotMaxAggregateOutputType | null
  }

  export type SnapshotAvgAggregateOutputType = {
    recordCount: number | null
  }

  export type SnapshotSumAggregateOutputType = {
    recordCount: number | null
  }

  export type SnapshotMinAggregateOutputType = {
    id: string | null
    dataSourceId: string | null
    data: string | null
    metadata: string | null
    recordCount: number | null
    createdAt: Date | null
  }

  export type SnapshotMaxAggregateOutputType = {
    id: string | null
    dataSourceId: string | null
    data: string | null
    metadata: string | null
    recordCount: number | null
    createdAt: Date | null
  }

  export type SnapshotCountAggregateOutputType = {
    id: number
    dataSourceId: number
    data: number
    metadata: number
    recordCount: number
    createdAt: number
    _all: number
  }


  export type SnapshotAvgAggregateInputType = {
    recordCount?: true
  }

  export type SnapshotSumAggregateInputType = {
    recordCount?: true
  }

  export type SnapshotMinAggregateInputType = {
    id?: true
    dataSourceId?: true
    data?: true
    metadata?: true
    recordCount?: true
    createdAt?: true
  }

  export type SnapshotMaxAggregateInputType = {
    id?: true
    dataSourceId?: true
    data?: true
    metadata?: true
    recordCount?: true
    createdAt?: true
  }

  export type SnapshotCountAggregateInputType = {
    id?: true
    dataSourceId?: true
    data?: true
    metadata?: true
    recordCount?: true
    createdAt?: true
    _all?: true
  }

  export type SnapshotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Snapshot to aggregate.
     */
    where?: SnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Snapshots to fetch.
     */
    orderBy?: SnapshotOrderByWithRelationInput | SnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Snapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Snapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Snapshots
    **/
    _count?: true | SnapshotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SnapshotAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SnapshotSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SnapshotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SnapshotMaxAggregateInputType
  }

  export type GetSnapshotAggregateType<T extends SnapshotAggregateArgs> = {
        [P in keyof T & keyof AggregateSnapshot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSnapshot[P]>
      : GetScalarType<T[P], AggregateSnapshot[P]>
  }




  export type SnapshotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SnapshotWhereInput
    orderBy?: SnapshotOrderByWithAggregationInput | SnapshotOrderByWithAggregationInput[]
    by: SnapshotScalarFieldEnum[] | SnapshotScalarFieldEnum
    having?: SnapshotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SnapshotCountAggregateInputType | true
    _avg?: SnapshotAvgAggregateInputType
    _sum?: SnapshotSumAggregateInputType
    _min?: SnapshotMinAggregateInputType
    _max?: SnapshotMaxAggregateInputType
  }

  export type SnapshotGroupByOutputType = {
    id: string
    dataSourceId: string
    data: string
    metadata: string | null
    recordCount: number
    createdAt: Date
    _count: SnapshotCountAggregateOutputType | null
    _avg: SnapshotAvgAggregateOutputType | null
    _sum: SnapshotSumAggregateOutputType | null
    _min: SnapshotMinAggregateOutputType | null
    _max: SnapshotMaxAggregateOutputType | null
  }

  type GetSnapshotGroupByPayload<T extends SnapshotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SnapshotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SnapshotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SnapshotGroupByOutputType[P]>
            : GetScalarType<T[P], SnapshotGroupByOutputType[P]>
        }
      >
    >


  export type SnapshotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dataSourceId?: boolean
    data?: boolean
    metadata?: boolean
    recordCount?: boolean
    createdAt?: boolean
    dataSource?: boolean | DataSourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["snapshot"]>

  export type SnapshotSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dataSourceId?: boolean
    data?: boolean
    metadata?: boolean
    recordCount?: boolean
    createdAt?: boolean
    dataSource?: boolean | DataSourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["snapshot"]>

  export type SnapshotSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dataSourceId?: boolean
    data?: boolean
    metadata?: boolean
    recordCount?: boolean
    createdAt?: boolean
    dataSource?: boolean | DataSourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["snapshot"]>

  export type SnapshotSelectScalar = {
    id?: boolean
    dataSourceId?: boolean
    data?: boolean
    metadata?: boolean
    recordCount?: boolean
    createdAt?: boolean
  }

  export type SnapshotOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "dataSourceId" | "data" | "metadata" | "recordCount" | "createdAt", ExtArgs["result"]["snapshot"]>
  export type SnapshotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dataSource?: boolean | DataSourceDefaultArgs<ExtArgs>
  }
  export type SnapshotIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dataSource?: boolean | DataSourceDefaultArgs<ExtArgs>
  }
  export type SnapshotIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dataSource?: boolean | DataSourceDefaultArgs<ExtArgs>
  }

  export type $SnapshotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Snapshot"
    objects: {
      dataSource: Prisma.$DataSourcePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      dataSourceId: string
      data: string
      metadata: string | null
      recordCount: number
      createdAt: Date
    }, ExtArgs["result"]["snapshot"]>
    composites: {}
  }

  type SnapshotGetPayload<S extends boolean | null | undefined | SnapshotDefaultArgs> = $Result.GetResult<Prisma.$SnapshotPayload, S>

  type SnapshotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SnapshotFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SnapshotCountAggregateInputType | true
    }

  export interface SnapshotDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Snapshot'], meta: { name: 'Snapshot' } }
    /**
     * Find zero or one Snapshot that matches the filter.
     * @param {SnapshotFindUniqueArgs} args - Arguments to find a Snapshot
     * @example
     * // Get one Snapshot
     * const snapshot = await prisma.snapshot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SnapshotFindUniqueArgs>(args: SelectSubset<T, SnapshotFindUniqueArgs<ExtArgs>>): Prisma__SnapshotClient<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Snapshot that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SnapshotFindUniqueOrThrowArgs} args - Arguments to find a Snapshot
     * @example
     * // Get one Snapshot
     * const snapshot = await prisma.snapshot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SnapshotFindUniqueOrThrowArgs>(args: SelectSubset<T, SnapshotFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SnapshotClient<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Snapshot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SnapshotFindFirstArgs} args - Arguments to find a Snapshot
     * @example
     * // Get one Snapshot
     * const snapshot = await prisma.snapshot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SnapshotFindFirstArgs>(args?: SelectSubset<T, SnapshotFindFirstArgs<ExtArgs>>): Prisma__SnapshotClient<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Snapshot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SnapshotFindFirstOrThrowArgs} args - Arguments to find a Snapshot
     * @example
     * // Get one Snapshot
     * const snapshot = await prisma.snapshot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SnapshotFindFirstOrThrowArgs>(args?: SelectSubset<T, SnapshotFindFirstOrThrowArgs<ExtArgs>>): Prisma__SnapshotClient<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Snapshots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SnapshotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Snapshots
     * const snapshots = await prisma.snapshot.findMany()
     * 
     * // Get first 10 Snapshots
     * const snapshots = await prisma.snapshot.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const snapshotWithIdOnly = await prisma.snapshot.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SnapshotFindManyArgs>(args?: SelectSubset<T, SnapshotFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Snapshot.
     * @param {SnapshotCreateArgs} args - Arguments to create a Snapshot.
     * @example
     * // Create one Snapshot
     * const Snapshot = await prisma.snapshot.create({
     *   data: {
     *     // ... data to create a Snapshot
     *   }
     * })
     * 
     */
    create<T extends SnapshotCreateArgs>(args: SelectSubset<T, SnapshotCreateArgs<ExtArgs>>): Prisma__SnapshotClient<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Snapshots.
     * @param {SnapshotCreateManyArgs} args - Arguments to create many Snapshots.
     * @example
     * // Create many Snapshots
     * const snapshot = await prisma.snapshot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SnapshotCreateManyArgs>(args?: SelectSubset<T, SnapshotCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Snapshots and returns the data saved in the database.
     * @param {SnapshotCreateManyAndReturnArgs} args - Arguments to create many Snapshots.
     * @example
     * // Create many Snapshots
     * const snapshot = await prisma.snapshot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Snapshots and only return the `id`
     * const snapshotWithIdOnly = await prisma.snapshot.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SnapshotCreateManyAndReturnArgs>(args?: SelectSubset<T, SnapshotCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Snapshot.
     * @param {SnapshotDeleteArgs} args - Arguments to delete one Snapshot.
     * @example
     * // Delete one Snapshot
     * const Snapshot = await prisma.snapshot.delete({
     *   where: {
     *     // ... filter to delete one Snapshot
     *   }
     * })
     * 
     */
    delete<T extends SnapshotDeleteArgs>(args: SelectSubset<T, SnapshotDeleteArgs<ExtArgs>>): Prisma__SnapshotClient<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Snapshot.
     * @param {SnapshotUpdateArgs} args - Arguments to update one Snapshot.
     * @example
     * // Update one Snapshot
     * const snapshot = await prisma.snapshot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SnapshotUpdateArgs>(args: SelectSubset<T, SnapshotUpdateArgs<ExtArgs>>): Prisma__SnapshotClient<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Snapshots.
     * @param {SnapshotDeleteManyArgs} args - Arguments to filter Snapshots to delete.
     * @example
     * // Delete a few Snapshots
     * const { count } = await prisma.snapshot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SnapshotDeleteManyArgs>(args?: SelectSubset<T, SnapshotDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Snapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SnapshotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Snapshots
     * const snapshot = await prisma.snapshot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SnapshotUpdateManyArgs>(args: SelectSubset<T, SnapshotUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Snapshots and returns the data updated in the database.
     * @param {SnapshotUpdateManyAndReturnArgs} args - Arguments to update many Snapshots.
     * @example
     * // Update many Snapshots
     * const snapshot = await prisma.snapshot.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Snapshots and only return the `id`
     * const snapshotWithIdOnly = await prisma.snapshot.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SnapshotUpdateManyAndReturnArgs>(args: SelectSubset<T, SnapshotUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Snapshot.
     * @param {SnapshotUpsertArgs} args - Arguments to update or create a Snapshot.
     * @example
     * // Update or create a Snapshot
     * const snapshot = await prisma.snapshot.upsert({
     *   create: {
     *     // ... data to create a Snapshot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Snapshot we want to update
     *   }
     * })
     */
    upsert<T extends SnapshotUpsertArgs>(args: SelectSubset<T, SnapshotUpsertArgs<ExtArgs>>): Prisma__SnapshotClient<$Result.GetResult<Prisma.$SnapshotPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Snapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SnapshotCountArgs} args - Arguments to filter Snapshots to count.
     * @example
     * // Count the number of Snapshots
     * const count = await prisma.snapshot.count({
     *   where: {
     *     // ... the filter for the Snapshots we want to count
     *   }
     * })
    **/
    count<T extends SnapshotCountArgs>(
      args?: Subset<T, SnapshotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SnapshotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Snapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SnapshotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SnapshotAggregateArgs>(args: Subset<T, SnapshotAggregateArgs>): Prisma.PrismaPromise<GetSnapshotAggregateType<T>>

    /**
     * Group by Snapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SnapshotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SnapshotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SnapshotGroupByArgs['orderBy'] }
        : { orderBy?: SnapshotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SnapshotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSnapshotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Snapshot model
   */
  readonly fields: SnapshotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Snapshot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SnapshotClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    dataSource<T extends DataSourceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DataSourceDefaultArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Snapshot model
   */
  interface SnapshotFieldRefs {
    readonly id: FieldRef<"Snapshot", 'String'>
    readonly dataSourceId: FieldRef<"Snapshot", 'String'>
    readonly data: FieldRef<"Snapshot", 'String'>
    readonly metadata: FieldRef<"Snapshot", 'String'>
    readonly recordCount: FieldRef<"Snapshot", 'Int'>
    readonly createdAt: FieldRef<"Snapshot", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Snapshot findUnique
   */
  export type SnapshotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    /**
     * Filter, which Snapshot to fetch.
     */
    where: SnapshotWhereUniqueInput
  }

  /**
   * Snapshot findUniqueOrThrow
   */
  export type SnapshotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    /**
     * Filter, which Snapshot to fetch.
     */
    where: SnapshotWhereUniqueInput
  }

  /**
   * Snapshot findFirst
   */
  export type SnapshotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    /**
     * Filter, which Snapshot to fetch.
     */
    where?: SnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Snapshots to fetch.
     */
    orderBy?: SnapshotOrderByWithRelationInput | SnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Snapshots.
     */
    cursor?: SnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Snapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Snapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Snapshots.
     */
    distinct?: SnapshotScalarFieldEnum | SnapshotScalarFieldEnum[]
  }

  /**
   * Snapshot findFirstOrThrow
   */
  export type SnapshotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    /**
     * Filter, which Snapshot to fetch.
     */
    where?: SnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Snapshots to fetch.
     */
    orderBy?: SnapshotOrderByWithRelationInput | SnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Snapshots.
     */
    cursor?: SnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Snapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Snapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Snapshots.
     */
    distinct?: SnapshotScalarFieldEnum | SnapshotScalarFieldEnum[]
  }

  /**
   * Snapshot findMany
   */
  export type SnapshotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    /**
     * Filter, which Snapshots to fetch.
     */
    where?: SnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Snapshots to fetch.
     */
    orderBy?: SnapshotOrderByWithRelationInput | SnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Snapshots.
     */
    cursor?: SnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Snapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Snapshots.
     */
    skip?: number
    distinct?: SnapshotScalarFieldEnum | SnapshotScalarFieldEnum[]
  }

  /**
   * Snapshot create
   */
  export type SnapshotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    /**
     * The data needed to create a Snapshot.
     */
    data: XOR<SnapshotCreateInput, SnapshotUncheckedCreateInput>
  }

  /**
   * Snapshot createMany
   */
  export type SnapshotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Snapshots.
     */
    data: SnapshotCreateManyInput | SnapshotCreateManyInput[]
  }

  /**
   * Snapshot createManyAndReturn
   */
  export type SnapshotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * The data used to create many Snapshots.
     */
    data: SnapshotCreateManyInput | SnapshotCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Snapshot update
   */
  export type SnapshotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    /**
     * The data needed to update a Snapshot.
     */
    data: XOR<SnapshotUpdateInput, SnapshotUncheckedUpdateInput>
    /**
     * Choose, which Snapshot to update.
     */
    where: SnapshotWhereUniqueInput
  }

  /**
   * Snapshot updateMany
   */
  export type SnapshotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Snapshots.
     */
    data: XOR<SnapshotUpdateManyMutationInput, SnapshotUncheckedUpdateManyInput>
    /**
     * Filter which Snapshots to update
     */
    where?: SnapshotWhereInput
    /**
     * Limit how many Snapshots to update.
     */
    limit?: number
  }

  /**
   * Snapshot updateManyAndReturn
   */
  export type SnapshotUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * The data used to update Snapshots.
     */
    data: XOR<SnapshotUpdateManyMutationInput, SnapshotUncheckedUpdateManyInput>
    /**
     * Filter which Snapshots to update
     */
    where?: SnapshotWhereInput
    /**
     * Limit how many Snapshots to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Snapshot upsert
   */
  export type SnapshotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    /**
     * The filter to search for the Snapshot to update in case it exists.
     */
    where: SnapshotWhereUniqueInput
    /**
     * In case the Snapshot found by the `where` argument doesn't exist, create a new Snapshot with this data.
     */
    create: XOR<SnapshotCreateInput, SnapshotUncheckedCreateInput>
    /**
     * In case the Snapshot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SnapshotUpdateInput, SnapshotUncheckedUpdateInput>
  }

  /**
   * Snapshot delete
   */
  export type SnapshotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
    /**
     * Filter which Snapshot to delete.
     */
    where: SnapshotWhereUniqueInput
  }

  /**
   * Snapshot deleteMany
   */
  export type SnapshotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Snapshots to delete
     */
    where?: SnapshotWhereInput
    /**
     * Limit how many Snapshots to delete.
     */
    limit?: number
  }

  /**
   * Snapshot without action
   */
  export type SnapshotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Snapshot
     */
    select?: SnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Snapshot
     */
    omit?: SnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SnapshotInclude<ExtArgs> | null
  }


  /**
   * Model Relationship
   */

  export type AggregateRelationship = {
    _count: RelationshipCountAggregateOutputType | null
    _min: RelationshipMinAggregateOutputType | null
    _max: RelationshipMaxAggregateOutputType | null
  }

  export type RelationshipMinAggregateOutputType = {
    id: string | null
    sourceId: string | null
    targetId: string | null
    relationshipType: string | null
    metadata: string | null
    createdAt: Date | null
  }

  export type RelationshipMaxAggregateOutputType = {
    id: string | null
    sourceId: string | null
    targetId: string | null
    relationshipType: string | null
    metadata: string | null
    createdAt: Date | null
  }

  export type RelationshipCountAggregateOutputType = {
    id: number
    sourceId: number
    targetId: number
    relationshipType: number
    metadata: number
    createdAt: number
    _all: number
  }


  export type RelationshipMinAggregateInputType = {
    id?: true
    sourceId?: true
    targetId?: true
    relationshipType?: true
    metadata?: true
    createdAt?: true
  }

  export type RelationshipMaxAggregateInputType = {
    id?: true
    sourceId?: true
    targetId?: true
    relationshipType?: true
    metadata?: true
    createdAt?: true
  }

  export type RelationshipCountAggregateInputType = {
    id?: true
    sourceId?: true
    targetId?: true
    relationshipType?: true
    metadata?: true
    createdAt?: true
    _all?: true
  }

  export type RelationshipAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Relationship to aggregate.
     */
    where?: RelationshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Relationships to fetch.
     */
    orderBy?: RelationshipOrderByWithRelationInput | RelationshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RelationshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Relationships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Relationships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Relationships
    **/
    _count?: true | RelationshipCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RelationshipMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RelationshipMaxAggregateInputType
  }

  export type GetRelationshipAggregateType<T extends RelationshipAggregateArgs> = {
        [P in keyof T & keyof AggregateRelationship]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRelationship[P]>
      : GetScalarType<T[P], AggregateRelationship[P]>
  }




  export type RelationshipGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RelationshipWhereInput
    orderBy?: RelationshipOrderByWithAggregationInput | RelationshipOrderByWithAggregationInput[]
    by: RelationshipScalarFieldEnum[] | RelationshipScalarFieldEnum
    having?: RelationshipScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RelationshipCountAggregateInputType | true
    _min?: RelationshipMinAggregateInputType
    _max?: RelationshipMaxAggregateInputType
  }

  export type RelationshipGroupByOutputType = {
    id: string
    sourceId: string
    targetId: string
    relationshipType: string
    metadata: string | null
    createdAt: Date
    _count: RelationshipCountAggregateOutputType | null
    _min: RelationshipMinAggregateOutputType | null
    _max: RelationshipMaxAggregateOutputType | null
  }

  type GetRelationshipGroupByPayload<T extends RelationshipGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RelationshipGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RelationshipGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RelationshipGroupByOutputType[P]>
            : GetScalarType<T[P], RelationshipGroupByOutputType[P]>
        }
      >
    >


  export type RelationshipSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sourceId?: boolean
    targetId?: boolean
    relationshipType?: boolean
    metadata?: boolean
    createdAt?: boolean
    source?: boolean | DataSourceDefaultArgs<ExtArgs>
    target?: boolean | DataSourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["relationship"]>

  export type RelationshipSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sourceId?: boolean
    targetId?: boolean
    relationshipType?: boolean
    metadata?: boolean
    createdAt?: boolean
    source?: boolean | DataSourceDefaultArgs<ExtArgs>
    target?: boolean | DataSourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["relationship"]>

  export type RelationshipSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sourceId?: boolean
    targetId?: boolean
    relationshipType?: boolean
    metadata?: boolean
    createdAt?: boolean
    source?: boolean | DataSourceDefaultArgs<ExtArgs>
    target?: boolean | DataSourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["relationship"]>

  export type RelationshipSelectScalar = {
    id?: boolean
    sourceId?: boolean
    targetId?: boolean
    relationshipType?: boolean
    metadata?: boolean
    createdAt?: boolean
  }

  export type RelationshipOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sourceId" | "targetId" | "relationshipType" | "metadata" | "createdAt", ExtArgs["result"]["relationship"]>
  export type RelationshipInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | DataSourceDefaultArgs<ExtArgs>
    target?: boolean | DataSourceDefaultArgs<ExtArgs>
  }
  export type RelationshipIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | DataSourceDefaultArgs<ExtArgs>
    target?: boolean | DataSourceDefaultArgs<ExtArgs>
  }
  export type RelationshipIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | DataSourceDefaultArgs<ExtArgs>
    target?: boolean | DataSourceDefaultArgs<ExtArgs>
  }

  export type $RelationshipPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Relationship"
    objects: {
      source: Prisma.$DataSourcePayload<ExtArgs>
      target: Prisma.$DataSourcePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sourceId: string
      targetId: string
      relationshipType: string
      metadata: string | null
      createdAt: Date
    }, ExtArgs["result"]["relationship"]>
    composites: {}
  }

  type RelationshipGetPayload<S extends boolean | null | undefined | RelationshipDefaultArgs> = $Result.GetResult<Prisma.$RelationshipPayload, S>

  type RelationshipCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RelationshipFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RelationshipCountAggregateInputType | true
    }

  export interface RelationshipDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Relationship'], meta: { name: 'Relationship' } }
    /**
     * Find zero or one Relationship that matches the filter.
     * @param {RelationshipFindUniqueArgs} args - Arguments to find a Relationship
     * @example
     * // Get one Relationship
     * const relationship = await prisma.relationship.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RelationshipFindUniqueArgs>(args: SelectSubset<T, RelationshipFindUniqueArgs<ExtArgs>>): Prisma__RelationshipClient<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Relationship that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RelationshipFindUniqueOrThrowArgs} args - Arguments to find a Relationship
     * @example
     * // Get one Relationship
     * const relationship = await prisma.relationship.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RelationshipFindUniqueOrThrowArgs>(args: SelectSubset<T, RelationshipFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RelationshipClient<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Relationship that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipFindFirstArgs} args - Arguments to find a Relationship
     * @example
     * // Get one Relationship
     * const relationship = await prisma.relationship.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RelationshipFindFirstArgs>(args?: SelectSubset<T, RelationshipFindFirstArgs<ExtArgs>>): Prisma__RelationshipClient<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Relationship that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipFindFirstOrThrowArgs} args - Arguments to find a Relationship
     * @example
     * // Get one Relationship
     * const relationship = await prisma.relationship.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RelationshipFindFirstOrThrowArgs>(args?: SelectSubset<T, RelationshipFindFirstOrThrowArgs<ExtArgs>>): Prisma__RelationshipClient<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Relationships that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Relationships
     * const relationships = await prisma.relationship.findMany()
     * 
     * // Get first 10 Relationships
     * const relationships = await prisma.relationship.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const relationshipWithIdOnly = await prisma.relationship.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RelationshipFindManyArgs>(args?: SelectSubset<T, RelationshipFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Relationship.
     * @param {RelationshipCreateArgs} args - Arguments to create a Relationship.
     * @example
     * // Create one Relationship
     * const Relationship = await prisma.relationship.create({
     *   data: {
     *     // ... data to create a Relationship
     *   }
     * })
     * 
     */
    create<T extends RelationshipCreateArgs>(args: SelectSubset<T, RelationshipCreateArgs<ExtArgs>>): Prisma__RelationshipClient<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Relationships.
     * @param {RelationshipCreateManyArgs} args - Arguments to create many Relationships.
     * @example
     * // Create many Relationships
     * const relationship = await prisma.relationship.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RelationshipCreateManyArgs>(args?: SelectSubset<T, RelationshipCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Relationships and returns the data saved in the database.
     * @param {RelationshipCreateManyAndReturnArgs} args - Arguments to create many Relationships.
     * @example
     * // Create many Relationships
     * const relationship = await prisma.relationship.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Relationships and only return the `id`
     * const relationshipWithIdOnly = await prisma.relationship.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RelationshipCreateManyAndReturnArgs>(args?: SelectSubset<T, RelationshipCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Relationship.
     * @param {RelationshipDeleteArgs} args - Arguments to delete one Relationship.
     * @example
     * // Delete one Relationship
     * const Relationship = await prisma.relationship.delete({
     *   where: {
     *     // ... filter to delete one Relationship
     *   }
     * })
     * 
     */
    delete<T extends RelationshipDeleteArgs>(args: SelectSubset<T, RelationshipDeleteArgs<ExtArgs>>): Prisma__RelationshipClient<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Relationship.
     * @param {RelationshipUpdateArgs} args - Arguments to update one Relationship.
     * @example
     * // Update one Relationship
     * const relationship = await prisma.relationship.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RelationshipUpdateArgs>(args: SelectSubset<T, RelationshipUpdateArgs<ExtArgs>>): Prisma__RelationshipClient<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Relationships.
     * @param {RelationshipDeleteManyArgs} args - Arguments to filter Relationships to delete.
     * @example
     * // Delete a few Relationships
     * const { count } = await prisma.relationship.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RelationshipDeleteManyArgs>(args?: SelectSubset<T, RelationshipDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Relationships.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Relationships
     * const relationship = await prisma.relationship.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RelationshipUpdateManyArgs>(args: SelectSubset<T, RelationshipUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Relationships and returns the data updated in the database.
     * @param {RelationshipUpdateManyAndReturnArgs} args - Arguments to update many Relationships.
     * @example
     * // Update many Relationships
     * const relationship = await prisma.relationship.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Relationships and only return the `id`
     * const relationshipWithIdOnly = await prisma.relationship.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RelationshipUpdateManyAndReturnArgs>(args: SelectSubset<T, RelationshipUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Relationship.
     * @param {RelationshipUpsertArgs} args - Arguments to update or create a Relationship.
     * @example
     * // Update or create a Relationship
     * const relationship = await prisma.relationship.upsert({
     *   create: {
     *     // ... data to create a Relationship
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Relationship we want to update
     *   }
     * })
     */
    upsert<T extends RelationshipUpsertArgs>(args: SelectSubset<T, RelationshipUpsertArgs<ExtArgs>>): Prisma__RelationshipClient<$Result.GetResult<Prisma.$RelationshipPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Relationships.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipCountArgs} args - Arguments to filter Relationships to count.
     * @example
     * // Count the number of Relationships
     * const count = await prisma.relationship.count({
     *   where: {
     *     // ... the filter for the Relationships we want to count
     *   }
     * })
    **/
    count<T extends RelationshipCountArgs>(
      args?: Subset<T, RelationshipCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RelationshipCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Relationship.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RelationshipAggregateArgs>(args: Subset<T, RelationshipAggregateArgs>): Prisma.PrismaPromise<GetRelationshipAggregateType<T>>

    /**
     * Group by Relationship.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RelationshipGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RelationshipGroupByArgs['orderBy'] }
        : { orderBy?: RelationshipGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RelationshipGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRelationshipGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Relationship model
   */
  readonly fields: RelationshipFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Relationship.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RelationshipClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    source<T extends DataSourceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DataSourceDefaultArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    target<T extends DataSourceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DataSourceDefaultArgs<ExtArgs>>): Prisma__DataSourceClient<$Result.GetResult<Prisma.$DataSourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Relationship model
   */
  interface RelationshipFieldRefs {
    readonly id: FieldRef<"Relationship", 'String'>
    readonly sourceId: FieldRef<"Relationship", 'String'>
    readonly targetId: FieldRef<"Relationship", 'String'>
    readonly relationshipType: FieldRef<"Relationship", 'String'>
    readonly metadata: FieldRef<"Relationship", 'String'>
    readonly createdAt: FieldRef<"Relationship", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Relationship findUnique
   */
  export type RelationshipFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    /**
     * Filter, which Relationship to fetch.
     */
    where: RelationshipWhereUniqueInput
  }

  /**
   * Relationship findUniqueOrThrow
   */
  export type RelationshipFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    /**
     * Filter, which Relationship to fetch.
     */
    where: RelationshipWhereUniqueInput
  }

  /**
   * Relationship findFirst
   */
  export type RelationshipFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    /**
     * Filter, which Relationship to fetch.
     */
    where?: RelationshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Relationships to fetch.
     */
    orderBy?: RelationshipOrderByWithRelationInput | RelationshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Relationships.
     */
    cursor?: RelationshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Relationships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Relationships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Relationships.
     */
    distinct?: RelationshipScalarFieldEnum | RelationshipScalarFieldEnum[]
  }

  /**
   * Relationship findFirstOrThrow
   */
  export type RelationshipFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    /**
     * Filter, which Relationship to fetch.
     */
    where?: RelationshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Relationships to fetch.
     */
    orderBy?: RelationshipOrderByWithRelationInput | RelationshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Relationships.
     */
    cursor?: RelationshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Relationships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Relationships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Relationships.
     */
    distinct?: RelationshipScalarFieldEnum | RelationshipScalarFieldEnum[]
  }

  /**
   * Relationship findMany
   */
  export type RelationshipFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    /**
     * Filter, which Relationships to fetch.
     */
    where?: RelationshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Relationships to fetch.
     */
    orderBy?: RelationshipOrderByWithRelationInput | RelationshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Relationships.
     */
    cursor?: RelationshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Relationships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Relationships.
     */
    skip?: number
    distinct?: RelationshipScalarFieldEnum | RelationshipScalarFieldEnum[]
  }

  /**
   * Relationship create
   */
  export type RelationshipCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    /**
     * The data needed to create a Relationship.
     */
    data: XOR<RelationshipCreateInput, RelationshipUncheckedCreateInput>
  }

  /**
   * Relationship createMany
   */
  export type RelationshipCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Relationships.
     */
    data: RelationshipCreateManyInput | RelationshipCreateManyInput[]
  }

  /**
   * Relationship createManyAndReturn
   */
  export type RelationshipCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * The data used to create many Relationships.
     */
    data: RelationshipCreateManyInput | RelationshipCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Relationship update
   */
  export type RelationshipUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    /**
     * The data needed to update a Relationship.
     */
    data: XOR<RelationshipUpdateInput, RelationshipUncheckedUpdateInput>
    /**
     * Choose, which Relationship to update.
     */
    where: RelationshipWhereUniqueInput
  }

  /**
   * Relationship updateMany
   */
  export type RelationshipUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Relationships.
     */
    data: XOR<RelationshipUpdateManyMutationInput, RelationshipUncheckedUpdateManyInput>
    /**
     * Filter which Relationships to update
     */
    where?: RelationshipWhereInput
    /**
     * Limit how many Relationships to update.
     */
    limit?: number
  }

  /**
   * Relationship updateManyAndReturn
   */
  export type RelationshipUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * The data used to update Relationships.
     */
    data: XOR<RelationshipUpdateManyMutationInput, RelationshipUncheckedUpdateManyInput>
    /**
     * Filter which Relationships to update
     */
    where?: RelationshipWhereInput
    /**
     * Limit how many Relationships to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Relationship upsert
   */
  export type RelationshipUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    /**
     * The filter to search for the Relationship to update in case it exists.
     */
    where: RelationshipWhereUniqueInput
    /**
     * In case the Relationship found by the `where` argument doesn't exist, create a new Relationship with this data.
     */
    create: XOR<RelationshipCreateInput, RelationshipUncheckedCreateInput>
    /**
     * In case the Relationship was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RelationshipUpdateInput, RelationshipUncheckedUpdateInput>
  }

  /**
   * Relationship delete
   */
  export type RelationshipDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
    /**
     * Filter which Relationship to delete.
     */
    where: RelationshipWhereUniqueInput
  }

  /**
   * Relationship deleteMany
   */
  export type RelationshipDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Relationships to delete
     */
    where?: RelationshipWhereInput
    /**
     * Limit how many Relationships to delete.
     */
    limit?: number
  }

  /**
   * Relationship without action
   */
  export type RelationshipDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Relationship
     */
    select?: RelationshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Relationship
     */
    omit?: RelationshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipInclude<ExtArgs> | null
  }


  /**
   * Model ConsolidatedModel
   */

  export type AggregateConsolidatedModel = {
    _count: ConsolidatedModelCountAggregateOutputType | null
    _min: ConsolidatedModelMinAggregateOutputType | null
    _max: ConsolidatedModelMaxAggregateOutputType | null
  }

  export type ConsolidatedModelMinAggregateOutputType = {
    id: string | null
    name: string | null
    modelData: string | null
    metadata: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ConsolidatedModelMaxAggregateOutputType = {
    id: string | null
    name: string | null
    modelData: string | null
    metadata: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ConsolidatedModelCountAggregateOutputType = {
    id: number
    name: number
    modelData: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ConsolidatedModelMinAggregateInputType = {
    id?: true
    name?: true
    modelData?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ConsolidatedModelMaxAggregateInputType = {
    id?: true
    name?: true
    modelData?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ConsolidatedModelCountAggregateInputType = {
    id?: true
    name?: true
    modelData?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ConsolidatedModelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConsolidatedModel to aggregate.
     */
    where?: ConsolidatedModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConsolidatedModels to fetch.
     */
    orderBy?: ConsolidatedModelOrderByWithRelationInput | ConsolidatedModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConsolidatedModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConsolidatedModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConsolidatedModels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ConsolidatedModels
    **/
    _count?: true | ConsolidatedModelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConsolidatedModelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConsolidatedModelMaxAggregateInputType
  }

  export type GetConsolidatedModelAggregateType<T extends ConsolidatedModelAggregateArgs> = {
        [P in keyof T & keyof AggregateConsolidatedModel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConsolidatedModel[P]>
      : GetScalarType<T[P], AggregateConsolidatedModel[P]>
  }




  export type ConsolidatedModelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConsolidatedModelWhereInput
    orderBy?: ConsolidatedModelOrderByWithAggregationInput | ConsolidatedModelOrderByWithAggregationInput[]
    by: ConsolidatedModelScalarFieldEnum[] | ConsolidatedModelScalarFieldEnum
    having?: ConsolidatedModelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConsolidatedModelCountAggregateInputType | true
    _min?: ConsolidatedModelMinAggregateInputType
    _max?: ConsolidatedModelMaxAggregateInputType
  }

  export type ConsolidatedModelGroupByOutputType = {
    id: string
    name: string
    modelData: string
    metadata: string | null
    createdAt: Date
    updatedAt: Date
    _count: ConsolidatedModelCountAggregateOutputType | null
    _min: ConsolidatedModelMinAggregateOutputType | null
    _max: ConsolidatedModelMaxAggregateOutputType | null
  }

  type GetConsolidatedModelGroupByPayload<T extends ConsolidatedModelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConsolidatedModelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConsolidatedModelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConsolidatedModelGroupByOutputType[P]>
            : GetScalarType<T[P], ConsolidatedModelGroupByOutputType[P]>
        }
      >
    >


  export type ConsolidatedModelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    modelData?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["consolidatedModel"]>

  export type ConsolidatedModelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    modelData?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["consolidatedModel"]>

  export type ConsolidatedModelSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    modelData?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["consolidatedModel"]>

  export type ConsolidatedModelSelectScalar = {
    id?: boolean
    name?: boolean
    modelData?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ConsolidatedModelOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "modelData" | "metadata" | "createdAt" | "updatedAt", ExtArgs["result"]["consolidatedModel"]>

  export type $ConsolidatedModelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ConsolidatedModel"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      modelData: string
      metadata: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["consolidatedModel"]>
    composites: {}
  }

  type ConsolidatedModelGetPayload<S extends boolean | null | undefined | ConsolidatedModelDefaultArgs> = $Result.GetResult<Prisma.$ConsolidatedModelPayload, S>

  type ConsolidatedModelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConsolidatedModelFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConsolidatedModelCountAggregateInputType | true
    }

  export interface ConsolidatedModelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ConsolidatedModel'], meta: { name: 'ConsolidatedModel' } }
    /**
     * Find zero or one ConsolidatedModel that matches the filter.
     * @param {ConsolidatedModelFindUniqueArgs} args - Arguments to find a ConsolidatedModel
     * @example
     * // Get one ConsolidatedModel
     * const consolidatedModel = await prisma.consolidatedModel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConsolidatedModelFindUniqueArgs>(args: SelectSubset<T, ConsolidatedModelFindUniqueArgs<ExtArgs>>): Prisma__ConsolidatedModelClient<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ConsolidatedModel that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConsolidatedModelFindUniqueOrThrowArgs} args - Arguments to find a ConsolidatedModel
     * @example
     * // Get one ConsolidatedModel
     * const consolidatedModel = await prisma.consolidatedModel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConsolidatedModelFindUniqueOrThrowArgs>(args: SelectSubset<T, ConsolidatedModelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConsolidatedModelClient<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConsolidatedModel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsolidatedModelFindFirstArgs} args - Arguments to find a ConsolidatedModel
     * @example
     * // Get one ConsolidatedModel
     * const consolidatedModel = await prisma.consolidatedModel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConsolidatedModelFindFirstArgs>(args?: SelectSubset<T, ConsolidatedModelFindFirstArgs<ExtArgs>>): Prisma__ConsolidatedModelClient<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConsolidatedModel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsolidatedModelFindFirstOrThrowArgs} args - Arguments to find a ConsolidatedModel
     * @example
     * // Get one ConsolidatedModel
     * const consolidatedModel = await prisma.consolidatedModel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConsolidatedModelFindFirstOrThrowArgs>(args?: SelectSubset<T, ConsolidatedModelFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConsolidatedModelClient<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ConsolidatedModels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsolidatedModelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ConsolidatedModels
     * const consolidatedModels = await prisma.consolidatedModel.findMany()
     * 
     * // Get first 10 ConsolidatedModels
     * const consolidatedModels = await prisma.consolidatedModel.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const consolidatedModelWithIdOnly = await prisma.consolidatedModel.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConsolidatedModelFindManyArgs>(args?: SelectSubset<T, ConsolidatedModelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ConsolidatedModel.
     * @param {ConsolidatedModelCreateArgs} args - Arguments to create a ConsolidatedModel.
     * @example
     * // Create one ConsolidatedModel
     * const ConsolidatedModel = await prisma.consolidatedModel.create({
     *   data: {
     *     // ... data to create a ConsolidatedModel
     *   }
     * })
     * 
     */
    create<T extends ConsolidatedModelCreateArgs>(args: SelectSubset<T, ConsolidatedModelCreateArgs<ExtArgs>>): Prisma__ConsolidatedModelClient<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ConsolidatedModels.
     * @param {ConsolidatedModelCreateManyArgs} args - Arguments to create many ConsolidatedModels.
     * @example
     * // Create many ConsolidatedModels
     * const consolidatedModel = await prisma.consolidatedModel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConsolidatedModelCreateManyArgs>(args?: SelectSubset<T, ConsolidatedModelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ConsolidatedModels and returns the data saved in the database.
     * @param {ConsolidatedModelCreateManyAndReturnArgs} args - Arguments to create many ConsolidatedModels.
     * @example
     * // Create many ConsolidatedModels
     * const consolidatedModel = await prisma.consolidatedModel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ConsolidatedModels and only return the `id`
     * const consolidatedModelWithIdOnly = await prisma.consolidatedModel.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConsolidatedModelCreateManyAndReturnArgs>(args?: SelectSubset<T, ConsolidatedModelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ConsolidatedModel.
     * @param {ConsolidatedModelDeleteArgs} args - Arguments to delete one ConsolidatedModel.
     * @example
     * // Delete one ConsolidatedModel
     * const ConsolidatedModel = await prisma.consolidatedModel.delete({
     *   where: {
     *     // ... filter to delete one ConsolidatedModel
     *   }
     * })
     * 
     */
    delete<T extends ConsolidatedModelDeleteArgs>(args: SelectSubset<T, ConsolidatedModelDeleteArgs<ExtArgs>>): Prisma__ConsolidatedModelClient<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ConsolidatedModel.
     * @param {ConsolidatedModelUpdateArgs} args - Arguments to update one ConsolidatedModel.
     * @example
     * // Update one ConsolidatedModel
     * const consolidatedModel = await prisma.consolidatedModel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConsolidatedModelUpdateArgs>(args: SelectSubset<T, ConsolidatedModelUpdateArgs<ExtArgs>>): Prisma__ConsolidatedModelClient<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ConsolidatedModels.
     * @param {ConsolidatedModelDeleteManyArgs} args - Arguments to filter ConsolidatedModels to delete.
     * @example
     * // Delete a few ConsolidatedModels
     * const { count } = await prisma.consolidatedModel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConsolidatedModelDeleteManyArgs>(args?: SelectSubset<T, ConsolidatedModelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConsolidatedModels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsolidatedModelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ConsolidatedModels
     * const consolidatedModel = await prisma.consolidatedModel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConsolidatedModelUpdateManyArgs>(args: SelectSubset<T, ConsolidatedModelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConsolidatedModels and returns the data updated in the database.
     * @param {ConsolidatedModelUpdateManyAndReturnArgs} args - Arguments to update many ConsolidatedModels.
     * @example
     * // Update many ConsolidatedModels
     * const consolidatedModel = await prisma.consolidatedModel.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ConsolidatedModels and only return the `id`
     * const consolidatedModelWithIdOnly = await prisma.consolidatedModel.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ConsolidatedModelUpdateManyAndReturnArgs>(args: SelectSubset<T, ConsolidatedModelUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ConsolidatedModel.
     * @param {ConsolidatedModelUpsertArgs} args - Arguments to update or create a ConsolidatedModel.
     * @example
     * // Update or create a ConsolidatedModel
     * const consolidatedModel = await prisma.consolidatedModel.upsert({
     *   create: {
     *     // ... data to create a ConsolidatedModel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ConsolidatedModel we want to update
     *   }
     * })
     */
    upsert<T extends ConsolidatedModelUpsertArgs>(args: SelectSubset<T, ConsolidatedModelUpsertArgs<ExtArgs>>): Prisma__ConsolidatedModelClient<$Result.GetResult<Prisma.$ConsolidatedModelPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ConsolidatedModels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsolidatedModelCountArgs} args - Arguments to filter ConsolidatedModels to count.
     * @example
     * // Count the number of ConsolidatedModels
     * const count = await prisma.consolidatedModel.count({
     *   where: {
     *     // ... the filter for the ConsolidatedModels we want to count
     *   }
     * })
    **/
    count<T extends ConsolidatedModelCountArgs>(
      args?: Subset<T, ConsolidatedModelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConsolidatedModelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ConsolidatedModel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsolidatedModelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConsolidatedModelAggregateArgs>(args: Subset<T, ConsolidatedModelAggregateArgs>): Prisma.PrismaPromise<GetConsolidatedModelAggregateType<T>>

    /**
     * Group by ConsolidatedModel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsolidatedModelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConsolidatedModelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConsolidatedModelGroupByArgs['orderBy'] }
        : { orderBy?: ConsolidatedModelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConsolidatedModelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConsolidatedModelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ConsolidatedModel model
   */
  readonly fields: ConsolidatedModelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ConsolidatedModel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConsolidatedModelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ConsolidatedModel model
   */
  interface ConsolidatedModelFieldRefs {
    readonly id: FieldRef<"ConsolidatedModel", 'String'>
    readonly name: FieldRef<"ConsolidatedModel", 'String'>
    readonly modelData: FieldRef<"ConsolidatedModel", 'String'>
    readonly metadata: FieldRef<"ConsolidatedModel", 'String'>
    readonly createdAt: FieldRef<"ConsolidatedModel", 'DateTime'>
    readonly updatedAt: FieldRef<"ConsolidatedModel", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ConsolidatedModel findUnique
   */
  export type ConsolidatedModelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * Filter, which ConsolidatedModel to fetch.
     */
    where: ConsolidatedModelWhereUniqueInput
  }

  /**
   * ConsolidatedModel findUniqueOrThrow
   */
  export type ConsolidatedModelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * Filter, which ConsolidatedModel to fetch.
     */
    where: ConsolidatedModelWhereUniqueInput
  }

  /**
   * ConsolidatedModel findFirst
   */
  export type ConsolidatedModelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * Filter, which ConsolidatedModel to fetch.
     */
    where?: ConsolidatedModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConsolidatedModels to fetch.
     */
    orderBy?: ConsolidatedModelOrderByWithRelationInput | ConsolidatedModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConsolidatedModels.
     */
    cursor?: ConsolidatedModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConsolidatedModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConsolidatedModels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConsolidatedModels.
     */
    distinct?: ConsolidatedModelScalarFieldEnum | ConsolidatedModelScalarFieldEnum[]
  }

  /**
   * ConsolidatedModel findFirstOrThrow
   */
  export type ConsolidatedModelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * Filter, which ConsolidatedModel to fetch.
     */
    where?: ConsolidatedModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConsolidatedModels to fetch.
     */
    orderBy?: ConsolidatedModelOrderByWithRelationInput | ConsolidatedModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConsolidatedModels.
     */
    cursor?: ConsolidatedModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConsolidatedModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConsolidatedModels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConsolidatedModels.
     */
    distinct?: ConsolidatedModelScalarFieldEnum | ConsolidatedModelScalarFieldEnum[]
  }

  /**
   * ConsolidatedModel findMany
   */
  export type ConsolidatedModelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * Filter, which ConsolidatedModels to fetch.
     */
    where?: ConsolidatedModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConsolidatedModels to fetch.
     */
    orderBy?: ConsolidatedModelOrderByWithRelationInput | ConsolidatedModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ConsolidatedModels.
     */
    cursor?: ConsolidatedModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConsolidatedModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConsolidatedModels.
     */
    skip?: number
    distinct?: ConsolidatedModelScalarFieldEnum | ConsolidatedModelScalarFieldEnum[]
  }

  /**
   * ConsolidatedModel create
   */
  export type ConsolidatedModelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * The data needed to create a ConsolidatedModel.
     */
    data: XOR<ConsolidatedModelCreateInput, ConsolidatedModelUncheckedCreateInput>
  }

  /**
   * ConsolidatedModel createMany
   */
  export type ConsolidatedModelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ConsolidatedModels.
     */
    data: ConsolidatedModelCreateManyInput | ConsolidatedModelCreateManyInput[]
  }

  /**
   * ConsolidatedModel createManyAndReturn
   */
  export type ConsolidatedModelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * The data used to create many ConsolidatedModels.
     */
    data: ConsolidatedModelCreateManyInput | ConsolidatedModelCreateManyInput[]
  }

  /**
   * ConsolidatedModel update
   */
  export type ConsolidatedModelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * The data needed to update a ConsolidatedModel.
     */
    data: XOR<ConsolidatedModelUpdateInput, ConsolidatedModelUncheckedUpdateInput>
    /**
     * Choose, which ConsolidatedModel to update.
     */
    where: ConsolidatedModelWhereUniqueInput
  }

  /**
   * ConsolidatedModel updateMany
   */
  export type ConsolidatedModelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ConsolidatedModels.
     */
    data: XOR<ConsolidatedModelUpdateManyMutationInput, ConsolidatedModelUncheckedUpdateManyInput>
    /**
     * Filter which ConsolidatedModels to update
     */
    where?: ConsolidatedModelWhereInput
    /**
     * Limit how many ConsolidatedModels to update.
     */
    limit?: number
  }

  /**
   * ConsolidatedModel updateManyAndReturn
   */
  export type ConsolidatedModelUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * The data used to update ConsolidatedModels.
     */
    data: XOR<ConsolidatedModelUpdateManyMutationInput, ConsolidatedModelUncheckedUpdateManyInput>
    /**
     * Filter which ConsolidatedModels to update
     */
    where?: ConsolidatedModelWhereInput
    /**
     * Limit how many ConsolidatedModels to update.
     */
    limit?: number
  }

  /**
   * ConsolidatedModel upsert
   */
  export type ConsolidatedModelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * The filter to search for the ConsolidatedModel to update in case it exists.
     */
    where: ConsolidatedModelWhereUniqueInput
    /**
     * In case the ConsolidatedModel found by the `where` argument doesn't exist, create a new ConsolidatedModel with this data.
     */
    create: XOR<ConsolidatedModelCreateInput, ConsolidatedModelUncheckedCreateInput>
    /**
     * In case the ConsolidatedModel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConsolidatedModelUpdateInput, ConsolidatedModelUncheckedUpdateInput>
  }

  /**
   * ConsolidatedModel delete
   */
  export type ConsolidatedModelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
    /**
     * Filter which ConsolidatedModel to delete.
     */
    where: ConsolidatedModelWhereUniqueInput
  }

  /**
   * ConsolidatedModel deleteMany
   */
  export type ConsolidatedModelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConsolidatedModels to delete
     */
    where?: ConsolidatedModelWhereInput
    /**
     * Limit how many ConsolidatedModels to delete.
     */
    limit?: number
  }

  /**
   * ConsolidatedModel without action
   */
  export type ConsolidatedModelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsolidatedModel
     */
    select?: ConsolidatedModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsolidatedModel
     */
    omit?: ConsolidatedModelOmit<ExtArgs> | null
  }


  /**
   * Model ImportHistory
   */

  export type AggregateImportHistory = {
    _count: ImportHistoryCountAggregateOutputType | null
    _avg: ImportHistoryAvgAggregateOutputType | null
    _sum: ImportHistorySumAggregateOutputType | null
    _min: ImportHistoryMinAggregateOutputType | null
    _max: ImportHistoryMaxAggregateOutputType | null
  }

  export type ImportHistoryAvgAggregateOutputType = {
    recordCount: number | null
  }

  export type ImportHistorySumAggregateOutputType = {
    recordCount: number | null
  }

  export type ImportHistoryMinAggregateOutputType = {
    id: string | null
    dataSourceId: string | null
    fileName: string | null
    recordCount: number | null
    status: string | null
    error: string | null
    createdAt: Date | null
    completedAt: Date | null
  }

  export type ImportHistoryMaxAggregateOutputType = {
    id: string | null
    dataSourceId: string | null
    fileName: string | null
    recordCount: number | null
    status: string | null
    error: string | null
    createdAt: Date | null
    completedAt: Date | null
  }

  export type ImportHistoryCountAggregateOutputType = {
    id: number
    dataSourceId: number
    fileName: number
    recordCount: number
    status: number
    error: number
    createdAt: number
    completedAt: number
    _all: number
  }


  export type ImportHistoryAvgAggregateInputType = {
    recordCount?: true
  }

  export type ImportHistorySumAggregateInputType = {
    recordCount?: true
  }

  export type ImportHistoryMinAggregateInputType = {
    id?: true
    dataSourceId?: true
    fileName?: true
    recordCount?: true
    status?: true
    error?: true
    createdAt?: true
    completedAt?: true
  }

  export type ImportHistoryMaxAggregateInputType = {
    id?: true
    dataSourceId?: true
    fileName?: true
    recordCount?: true
    status?: true
    error?: true
    createdAt?: true
    completedAt?: true
  }

  export type ImportHistoryCountAggregateInputType = {
    id?: true
    dataSourceId?: true
    fileName?: true
    recordCount?: true
    status?: true
    error?: true
    createdAt?: true
    completedAt?: true
    _all?: true
  }

  export type ImportHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ImportHistory to aggregate.
     */
    where?: ImportHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ImportHistories to fetch.
     */
    orderBy?: ImportHistoryOrderByWithRelationInput | ImportHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ImportHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ImportHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ImportHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ImportHistories
    **/
    _count?: true | ImportHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ImportHistoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ImportHistorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ImportHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ImportHistoryMaxAggregateInputType
  }

  export type GetImportHistoryAggregateType<T extends ImportHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateImportHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateImportHistory[P]>
      : GetScalarType<T[P], AggregateImportHistory[P]>
  }




  export type ImportHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ImportHistoryWhereInput
    orderBy?: ImportHistoryOrderByWithAggregationInput | ImportHistoryOrderByWithAggregationInput[]
    by: ImportHistoryScalarFieldEnum[] | ImportHistoryScalarFieldEnum
    having?: ImportHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ImportHistoryCountAggregateInputType | true
    _avg?: ImportHistoryAvgAggregateInputType
    _sum?: ImportHistorySumAggregateInputType
    _min?: ImportHistoryMinAggregateInputType
    _max?: ImportHistoryMaxAggregateInputType
  }

  export type ImportHistoryGroupByOutputType = {
    id: string
    dataSourceId: string
    fileName: string | null
    recordCount: number
    status: string
    error: string | null
    createdAt: Date
    completedAt: Date | null
    _count: ImportHistoryCountAggregateOutputType | null
    _avg: ImportHistoryAvgAggregateOutputType | null
    _sum: ImportHistorySumAggregateOutputType | null
    _min: ImportHistoryMinAggregateOutputType | null
    _max: ImportHistoryMaxAggregateOutputType | null
  }

  type GetImportHistoryGroupByPayload<T extends ImportHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ImportHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ImportHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ImportHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], ImportHistoryGroupByOutputType[P]>
        }
      >
    >


  export type ImportHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dataSourceId?: boolean
    fileName?: boolean
    recordCount?: boolean
    status?: boolean
    error?: boolean
    createdAt?: boolean
    completedAt?: boolean
  }, ExtArgs["result"]["importHistory"]>

  export type ImportHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dataSourceId?: boolean
    fileName?: boolean
    recordCount?: boolean
    status?: boolean
    error?: boolean
    createdAt?: boolean
    completedAt?: boolean
  }, ExtArgs["result"]["importHistory"]>

  export type ImportHistorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dataSourceId?: boolean
    fileName?: boolean
    recordCount?: boolean
    status?: boolean
    error?: boolean
    createdAt?: boolean
    completedAt?: boolean
  }, ExtArgs["result"]["importHistory"]>

  export type ImportHistorySelectScalar = {
    id?: boolean
    dataSourceId?: boolean
    fileName?: boolean
    recordCount?: boolean
    status?: boolean
    error?: boolean
    createdAt?: boolean
    completedAt?: boolean
  }

  export type ImportHistoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "dataSourceId" | "fileName" | "recordCount" | "status" | "error" | "createdAt" | "completedAt", ExtArgs["result"]["importHistory"]>

  export type $ImportHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ImportHistory"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      dataSourceId: string
      fileName: string | null
      recordCount: number
      status: string
      error: string | null
      createdAt: Date
      completedAt: Date | null
    }, ExtArgs["result"]["importHistory"]>
    composites: {}
  }

  type ImportHistoryGetPayload<S extends boolean | null | undefined | ImportHistoryDefaultArgs> = $Result.GetResult<Prisma.$ImportHistoryPayload, S>

  type ImportHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ImportHistoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ImportHistoryCountAggregateInputType | true
    }

  export interface ImportHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ImportHistory'], meta: { name: 'ImportHistory' } }
    /**
     * Find zero or one ImportHistory that matches the filter.
     * @param {ImportHistoryFindUniqueArgs} args - Arguments to find a ImportHistory
     * @example
     * // Get one ImportHistory
     * const importHistory = await prisma.importHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ImportHistoryFindUniqueArgs>(args: SelectSubset<T, ImportHistoryFindUniqueArgs<ExtArgs>>): Prisma__ImportHistoryClient<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ImportHistory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ImportHistoryFindUniqueOrThrowArgs} args - Arguments to find a ImportHistory
     * @example
     * // Get one ImportHistory
     * const importHistory = await prisma.importHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ImportHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, ImportHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ImportHistoryClient<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ImportHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ImportHistoryFindFirstArgs} args - Arguments to find a ImportHistory
     * @example
     * // Get one ImportHistory
     * const importHistory = await prisma.importHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ImportHistoryFindFirstArgs>(args?: SelectSubset<T, ImportHistoryFindFirstArgs<ExtArgs>>): Prisma__ImportHistoryClient<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ImportHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ImportHistoryFindFirstOrThrowArgs} args - Arguments to find a ImportHistory
     * @example
     * // Get one ImportHistory
     * const importHistory = await prisma.importHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ImportHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, ImportHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__ImportHistoryClient<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ImportHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ImportHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ImportHistories
     * const importHistories = await prisma.importHistory.findMany()
     * 
     * // Get first 10 ImportHistories
     * const importHistories = await prisma.importHistory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const importHistoryWithIdOnly = await prisma.importHistory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ImportHistoryFindManyArgs>(args?: SelectSubset<T, ImportHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ImportHistory.
     * @param {ImportHistoryCreateArgs} args - Arguments to create a ImportHistory.
     * @example
     * // Create one ImportHistory
     * const ImportHistory = await prisma.importHistory.create({
     *   data: {
     *     // ... data to create a ImportHistory
     *   }
     * })
     * 
     */
    create<T extends ImportHistoryCreateArgs>(args: SelectSubset<T, ImportHistoryCreateArgs<ExtArgs>>): Prisma__ImportHistoryClient<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ImportHistories.
     * @param {ImportHistoryCreateManyArgs} args - Arguments to create many ImportHistories.
     * @example
     * // Create many ImportHistories
     * const importHistory = await prisma.importHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ImportHistoryCreateManyArgs>(args?: SelectSubset<T, ImportHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ImportHistories and returns the data saved in the database.
     * @param {ImportHistoryCreateManyAndReturnArgs} args - Arguments to create many ImportHistories.
     * @example
     * // Create many ImportHistories
     * const importHistory = await prisma.importHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ImportHistories and only return the `id`
     * const importHistoryWithIdOnly = await prisma.importHistory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ImportHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, ImportHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ImportHistory.
     * @param {ImportHistoryDeleteArgs} args - Arguments to delete one ImportHistory.
     * @example
     * // Delete one ImportHistory
     * const ImportHistory = await prisma.importHistory.delete({
     *   where: {
     *     // ... filter to delete one ImportHistory
     *   }
     * })
     * 
     */
    delete<T extends ImportHistoryDeleteArgs>(args: SelectSubset<T, ImportHistoryDeleteArgs<ExtArgs>>): Prisma__ImportHistoryClient<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ImportHistory.
     * @param {ImportHistoryUpdateArgs} args - Arguments to update one ImportHistory.
     * @example
     * // Update one ImportHistory
     * const importHistory = await prisma.importHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ImportHistoryUpdateArgs>(args: SelectSubset<T, ImportHistoryUpdateArgs<ExtArgs>>): Prisma__ImportHistoryClient<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ImportHistories.
     * @param {ImportHistoryDeleteManyArgs} args - Arguments to filter ImportHistories to delete.
     * @example
     * // Delete a few ImportHistories
     * const { count } = await prisma.importHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ImportHistoryDeleteManyArgs>(args?: SelectSubset<T, ImportHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ImportHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ImportHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ImportHistories
     * const importHistory = await prisma.importHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ImportHistoryUpdateManyArgs>(args: SelectSubset<T, ImportHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ImportHistories and returns the data updated in the database.
     * @param {ImportHistoryUpdateManyAndReturnArgs} args - Arguments to update many ImportHistories.
     * @example
     * // Update many ImportHistories
     * const importHistory = await prisma.importHistory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ImportHistories and only return the `id`
     * const importHistoryWithIdOnly = await prisma.importHistory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ImportHistoryUpdateManyAndReturnArgs>(args: SelectSubset<T, ImportHistoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ImportHistory.
     * @param {ImportHistoryUpsertArgs} args - Arguments to update or create a ImportHistory.
     * @example
     * // Update or create a ImportHistory
     * const importHistory = await prisma.importHistory.upsert({
     *   create: {
     *     // ... data to create a ImportHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ImportHistory we want to update
     *   }
     * })
     */
    upsert<T extends ImportHistoryUpsertArgs>(args: SelectSubset<T, ImportHistoryUpsertArgs<ExtArgs>>): Prisma__ImportHistoryClient<$Result.GetResult<Prisma.$ImportHistoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ImportHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ImportHistoryCountArgs} args - Arguments to filter ImportHistories to count.
     * @example
     * // Count the number of ImportHistories
     * const count = await prisma.importHistory.count({
     *   where: {
     *     // ... the filter for the ImportHistories we want to count
     *   }
     * })
    **/
    count<T extends ImportHistoryCountArgs>(
      args?: Subset<T, ImportHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ImportHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ImportHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ImportHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ImportHistoryAggregateArgs>(args: Subset<T, ImportHistoryAggregateArgs>): Prisma.PrismaPromise<GetImportHistoryAggregateType<T>>

    /**
     * Group by ImportHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ImportHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ImportHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ImportHistoryGroupByArgs['orderBy'] }
        : { orderBy?: ImportHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ImportHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetImportHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ImportHistory model
   */
  readonly fields: ImportHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ImportHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ImportHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ImportHistory model
   */
  interface ImportHistoryFieldRefs {
    readonly id: FieldRef<"ImportHistory", 'String'>
    readonly dataSourceId: FieldRef<"ImportHistory", 'String'>
    readonly fileName: FieldRef<"ImportHistory", 'String'>
    readonly recordCount: FieldRef<"ImportHistory", 'Int'>
    readonly status: FieldRef<"ImportHistory", 'String'>
    readonly error: FieldRef<"ImportHistory", 'String'>
    readonly createdAt: FieldRef<"ImportHistory", 'DateTime'>
    readonly completedAt: FieldRef<"ImportHistory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ImportHistory findUnique
   */
  export type ImportHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ImportHistory to fetch.
     */
    where: ImportHistoryWhereUniqueInput
  }

  /**
   * ImportHistory findUniqueOrThrow
   */
  export type ImportHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ImportHistory to fetch.
     */
    where: ImportHistoryWhereUniqueInput
  }

  /**
   * ImportHistory findFirst
   */
  export type ImportHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ImportHistory to fetch.
     */
    where?: ImportHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ImportHistories to fetch.
     */
    orderBy?: ImportHistoryOrderByWithRelationInput | ImportHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ImportHistories.
     */
    cursor?: ImportHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ImportHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ImportHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ImportHistories.
     */
    distinct?: ImportHistoryScalarFieldEnum | ImportHistoryScalarFieldEnum[]
  }

  /**
   * ImportHistory findFirstOrThrow
   */
  export type ImportHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ImportHistory to fetch.
     */
    where?: ImportHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ImportHistories to fetch.
     */
    orderBy?: ImportHistoryOrderByWithRelationInput | ImportHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ImportHistories.
     */
    cursor?: ImportHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ImportHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ImportHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ImportHistories.
     */
    distinct?: ImportHistoryScalarFieldEnum | ImportHistoryScalarFieldEnum[]
  }

  /**
   * ImportHistory findMany
   */
  export type ImportHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ImportHistories to fetch.
     */
    where?: ImportHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ImportHistories to fetch.
     */
    orderBy?: ImportHistoryOrderByWithRelationInput | ImportHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ImportHistories.
     */
    cursor?: ImportHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ImportHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ImportHistories.
     */
    skip?: number
    distinct?: ImportHistoryScalarFieldEnum | ImportHistoryScalarFieldEnum[]
  }

  /**
   * ImportHistory create
   */
  export type ImportHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * The data needed to create a ImportHistory.
     */
    data: XOR<ImportHistoryCreateInput, ImportHistoryUncheckedCreateInput>
  }

  /**
   * ImportHistory createMany
   */
  export type ImportHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ImportHistories.
     */
    data: ImportHistoryCreateManyInput | ImportHistoryCreateManyInput[]
  }

  /**
   * ImportHistory createManyAndReturn
   */
  export type ImportHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * The data used to create many ImportHistories.
     */
    data: ImportHistoryCreateManyInput | ImportHistoryCreateManyInput[]
  }

  /**
   * ImportHistory update
   */
  export type ImportHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * The data needed to update a ImportHistory.
     */
    data: XOR<ImportHistoryUpdateInput, ImportHistoryUncheckedUpdateInput>
    /**
     * Choose, which ImportHistory to update.
     */
    where: ImportHistoryWhereUniqueInput
  }

  /**
   * ImportHistory updateMany
   */
  export type ImportHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ImportHistories.
     */
    data: XOR<ImportHistoryUpdateManyMutationInput, ImportHistoryUncheckedUpdateManyInput>
    /**
     * Filter which ImportHistories to update
     */
    where?: ImportHistoryWhereInput
    /**
     * Limit how many ImportHistories to update.
     */
    limit?: number
  }

  /**
   * ImportHistory updateManyAndReturn
   */
  export type ImportHistoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * The data used to update ImportHistories.
     */
    data: XOR<ImportHistoryUpdateManyMutationInput, ImportHistoryUncheckedUpdateManyInput>
    /**
     * Filter which ImportHistories to update
     */
    where?: ImportHistoryWhereInput
    /**
     * Limit how many ImportHistories to update.
     */
    limit?: number
  }

  /**
   * ImportHistory upsert
   */
  export type ImportHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * The filter to search for the ImportHistory to update in case it exists.
     */
    where: ImportHistoryWhereUniqueInput
    /**
     * In case the ImportHistory found by the `where` argument doesn't exist, create a new ImportHistory with this data.
     */
    create: XOR<ImportHistoryCreateInput, ImportHistoryUncheckedCreateInput>
    /**
     * In case the ImportHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ImportHistoryUpdateInput, ImportHistoryUncheckedUpdateInput>
  }

  /**
   * ImportHistory delete
   */
  export type ImportHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
    /**
     * Filter which ImportHistory to delete.
     */
    where: ImportHistoryWhereUniqueInput
  }

  /**
   * ImportHistory deleteMany
   */
  export type ImportHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ImportHistories to delete
     */
    where?: ImportHistoryWhereInput
    /**
     * Limit how many ImportHistories to delete.
     */
    limit?: number
  }

  /**
   * ImportHistory without action
   */
  export type ImportHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ImportHistory
     */
    select?: ImportHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ImportHistory
     */
    omit?: ImportHistoryOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const DataSourceScalarFieldEnum: {
    id: 'id',
    name: 'name',
    type: 'type',
    config: 'config',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    lastSyncAt: 'lastSyncAt'
  };

  export type DataSourceScalarFieldEnum = (typeof DataSourceScalarFieldEnum)[keyof typeof DataSourceScalarFieldEnum]


  export const SnapshotScalarFieldEnum: {
    id: 'id',
    dataSourceId: 'dataSourceId',
    data: 'data',
    metadata: 'metadata',
    recordCount: 'recordCount',
    createdAt: 'createdAt'
  };

  export type SnapshotScalarFieldEnum = (typeof SnapshotScalarFieldEnum)[keyof typeof SnapshotScalarFieldEnum]


  export const RelationshipScalarFieldEnum: {
    id: 'id',
    sourceId: 'sourceId',
    targetId: 'targetId',
    relationshipType: 'relationshipType',
    metadata: 'metadata',
    createdAt: 'createdAt'
  };

  export type RelationshipScalarFieldEnum = (typeof RelationshipScalarFieldEnum)[keyof typeof RelationshipScalarFieldEnum]


  export const ConsolidatedModelScalarFieldEnum: {
    id: 'id',
    name: 'name',
    modelData: 'modelData',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ConsolidatedModelScalarFieldEnum = (typeof ConsolidatedModelScalarFieldEnum)[keyof typeof ConsolidatedModelScalarFieldEnum]


  export const ImportHistoryScalarFieldEnum: {
    id: 'id',
    dataSourceId: 'dataSourceId',
    fileName: 'fileName',
    recordCount: 'recordCount',
    status: 'status',
    error: 'error',
    createdAt: 'createdAt',
    completedAt: 'completedAt'
  };

  export type ImportHistoryScalarFieldEnum = (typeof ImportHistoryScalarFieldEnum)[keyof typeof ImportHistoryScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type DataSourceWhereInput = {
    AND?: DataSourceWhereInput | DataSourceWhereInput[]
    OR?: DataSourceWhereInput[]
    NOT?: DataSourceWhereInput | DataSourceWhereInput[]
    id?: StringFilter<"DataSource"> | string
    name?: StringFilter<"DataSource"> | string
    type?: StringFilter<"DataSource"> | string
    config?: StringFilter<"DataSource"> | string
    status?: StringFilter<"DataSource"> | string
    createdAt?: DateTimeFilter<"DataSource"> | Date | string
    updatedAt?: DateTimeFilter<"DataSource"> | Date | string
    lastSyncAt?: DateTimeNullableFilter<"DataSource"> | Date | string | null
    snapshots?: SnapshotListRelationFilter
    relationships?: RelationshipListRelationFilter
    targetRelationships?: RelationshipListRelationFilter
  }

  export type DataSourceOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    config?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSyncAt?: SortOrderInput | SortOrder
    snapshots?: SnapshotOrderByRelationAggregateInput
    relationships?: RelationshipOrderByRelationAggregateInput
    targetRelationships?: RelationshipOrderByRelationAggregateInput
  }

  export type DataSourceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DataSourceWhereInput | DataSourceWhereInput[]
    OR?: DataSourceWhereInput[]
    NOT?: DataSourceWhereInput | DataSourceWhereInput[]
    name?: StringFilter<"DataSource"> | string
    type?: StringFilter<"DataSource"> | string
    config?: StringFilter<"DataSource"> | string
    status?: StringFilter<"DataSource"> | string
    createdAt?: DateTimeFilter<"DataSource"> | Date | string
    updatedAt?: DateTimeFilter<"DataSource"> | Date | string
    lastSyncAt?: DateTimeNullableFilter<"DataSource"> | Date | string | null
    snapshots?: SnapshotListRelationFilter
    relationships?: RelationshipListRelationFilter
    targetRelationships?: RelationshipListRelationFilter
  }, "id">

  export type DataSourceOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    config?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSyncAt?: SortOrderInput | SortOrder
    _count?: DataSourceCountOrderByAggregateInput
    _max?: DataSourceMaxOrderByAggregateInput
    _min?: DataSourceMinOrderByAggregateInput
  }

  export type DataSourceScalarWhereWithAggregatesInput = {
    AND?: DataSourceScalarWhereWithAggregatesInput | DataSourceScalarWhereWithAggregatesInput[]
    OR?: DataSourceScalarWhereWithAggregatesInput[]
    NOT?: DataSourceScalarWhereWithAggregatesInput | DataSourceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DataSource"> | string
    name?: StringWithAggregatesFilter<"DataSource"> | string
    type?: StringWithAggregatesFilter<"DataSource"> | string
    config?: StringWithAggregatesFilter<"DataSource"> | string
    status?: StringWithAggregatesFilter<"DataSource"> | string
    createdAt?: DateTimeWithAggregatesFilter<"DataSource"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"DataSource"> | Date | string
    lastSyncAt?: DateTimeNullableWithAggregatesFilter<"DataSource"> | Date | string | null
  }

  export type SnapshotWhereInput = {
    AND?: SnapshotWhereInput | SnapshotWhereInput[]
    OR?: SnapshotWhereInput[]
    NOT?: SnapshotWhereInput | SnapshotWhereInput[]
    id?: StringFilter<"Snapshot"> | string
    dataSourceId?: StringFilter<"Snapshot"> | string
    data?: StringFilter<"Snapshot"> | string
    metadata?: StringNullableFilter<"Snapshot"> | string | null
    recordCount?: IntFilter<"Snapshot"> | number
    createdAt?: DateTimeFilter<"Snapshot"> | Date | string
    dataSource?: XOR<DataSourceScalarRelationFilter, DataSourceWhereInput>
  }

  export type SnapshotOrderByWithRelationInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    data?: SortOrder
    metadata?: SortOrderInput | SortOrder
    recordCount?: SortOrder
    createdAt?: SortOrder
    dataSource?: DataSourceOrderByWithRelationInput
  }

  export type SnapshotWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SnapshotWhereInput | SnapshotWhereInput[]
    OR?: SnapshotWhereInput[]
    NOT?: SnapshotWhereInput | SnapshotWhereInput[]
    dataSourceId?: StringFilter<"Snapshot"> | string
    data?: StringFilter<"Snapshot"> | string
    metadata?: StringNullableFilter<"Snapshot"> | string | null
    recordCount?: IntFilter<"Snapshot"> | number
    createdAt?: DateTimeFilter<"Snapshot"> | Date | string
    dataSource?: XOR<DataSourceScalarRelationFilter, DataSourceWhereInput>
  }, "id">

  export type SnapshotOrderByWithAggregationInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    data?: SortOrder
    metadata?: SortOrderInput | SortOrder
    recordCount?: SortOrder
    createdAt?: SortOrder
    _count?: SnapshotCountOrderByAggregateInput
    _avg?: SnapshotAvgOrderByAggregateInput
    _max?: SnapshotMaxOrderByAggregateInput
    _min?: SnapshotMinOrderByAggregateInput
    _sum?: SnapshotSumOrderByAggregateInput
  }

  export type SnapshotScalarWhereWithAggregatesInput = {
    AND?: SnapshotScalarWhereWithAggregatesInput | SnapshotScalarWhereWithAggregatesInput[]
    OR?: SnapshotScalarWhereWithAggregatesInput[]
    NOT?: SnapshotScalarWhereWithAggregatesInput | SnapshotScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Snapshot"> | string
    dataSourceId?: StringWithAggregatesFilter<"Snapshot"> | string
    data?: StringWithAggregatesFilter<"Snapshot"> | string
    metadata?: StringNullableWithAggregatesFilter<"Snapshot"> | string | null
    recordCount?: IntWithAggregatesFilter<"Snapshot"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Snapshot"> | Date | string
  }

  export type RelationshipWhereInput = {
    AND?: RelationshipWhereInput | RelationshipWhereInput[]
    OR?: RelationshipWhereInput[]
    NOT?: RelationshipWhereInput | RelationshipWhereInput[]
    id?: StringFilter<"Relationship"> | string
    sourceId?: StringFilter<"Relationship"> | string
    targetId?: StringFilter<"Relationship"> | string
    relationshipType?: StringFilter<"Relationship"> | string
    metadata?: StringNullableFilter<"Relationship"> | string | null
    createdAt?: DateTimeFilter<"Relationship"> | Date | string
    source?: XOR<DataSourceScalarRelationFilter, DataSourceWhereInput>
    target?: XOR<DataSourceScalarRelationFilter, DataSourceWhereInput>
  }

  export type RelationshipOrderByWithRelationInput = {
    id?: SortOrder
    sourceId?: SortOrder
    targetId?: SortOrder
    relationshipType?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    source?: DataSourceOrderByWithRelationInput
    target?: DataSourceOrderByWithRelationInput
  }

  export type RelationshipWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RelationshipWhereInput | RelationshipWhereInput[]
    OR?: RelationshipWhereInput[]
    NOT?: RelationshipWhereInput | RelationshipWhereInput[]
    sourceId?: StringFilter<"Relationship"> | string
    targetId?: StringFilter<"Relationship"> | string
    relationshipType?: StringFilter<"Relationship"> | string
    metadata?: StringNullableFilter<"Relationship"> | string | null
    createdAt?: DateTimeFilter<"Relationship"> | Date | string
    source?: XOR<DataSourceScalarRelationFilter, DataSourceWhereInput>
    target?: XOR<DataSourceScalarRelationFilter, DataSourceWhereInput>
  }, "id">

  export type RelationshipOrderByWithAggregationInput = {
    id?: SortOrder
    sourceId?: SortOrder
    targetId?: SortOrder
    relationshipType?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: RelationshipCountOrderByAggregateInput
    _max?: RelationshipMaxOrderByAggregateInput
    _min?: RelationshipMinOrderByAggregateInput
  }

  export type RelationshipScalarWhereWithAggregatesInput = {
    AND?: RelationshipScalarWhereWithAggregatesInput | RelationshipScalarWhereWithAggregatesInput[]
    OR?: RelationshipScalarWhereWithAggregatesInput[]
    NOT?: RelationshipScalarWhereWithAggregatesInput | RelationshipScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Relationship"> | string
    sourceId?: StringWithAggregatesFilter<"Relationship"> | string
    targetId?: StringWithAggregatesFilter<"Relationship"> | string
    relationshipType?: StringWithAggregatesFilter<"Relationship"> | string
    metadata?: StringNullableWithAggregatesFilter<"Relationship"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Relationship"> | Date | string
  }

  export type ConsolidatedModelWhereInput = {
    AND?: ConsolidatedModelWhereInput | ConsolidatedModelWhereInput[]
    OR?: ConsolidatedModelWhereInput[]
    NOT?: ConsolidatedModelWhereInput | ConsolidatedModelWhereInput[]
    id?: StringFilter<"ConsolidatedModel"> | string
    name?: StringFilter<"ConsolidatedModel"> | string
    modelData?: StringFilter<"ConsolidatedModel"> | string
    metadata?: StringNullableFilter<"ConsolidatedModel"> | string | null
    createdAt?: DateTimeFilter<"ConsolidatedModel"> | Date | string
    updatedAt?: DateTimeFilter<"ConsolidatedModel"> | Date | string
  }

  export type ConsolidatedModelOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    modelData?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsolidatedModelWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConsolidatedModelWhereInput | ConsolidatedModelWhereInput[]
    OR?: ConsolidatedModelWhereInput[]
    NOT?: ConsolidatedModelWhereInput | ConsolidatedModelWhereInput[]
    name?: StringFilter<"ConsolidatedModel"> | string
    modelData?: StringFilter<"ConsolidatedModel"> | string
    metadata?: StringNullableFilter<"ConsolidatedModel"> | string | null
    createdAt?: DateTimeFilter<"ConsolidatedModel"> | Date | string
    updatedAt?: DateTimeFilter<"ConsolidatedModel"> | Date | string
  }, "id">

  export type ConsolidatedModelOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    modelData?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ConsolidatedModelCountOrderByAggregateInput
    _max?: ConsolidatedModelMaxOrderByAggregateInput
    _min?: ConsolidatedModelMinOrderByAggregateInput
  }

  export type ConsolidatedModelScalarWhereWithAggregatesInput = {
    AND?: ConsolidatedModelScalarWhereWithAggregatesInput | ConsolidatedModelScalarWhereWithAggregatesInput[]
    OR?: ConsolidatedModelScalarWhereWithAggregatesInput[]
    NOT?: ConsolidatedModelScalarWhereWithAggregatesInput | ConsolidatedModelScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ConsolidatedModel"> | string
    name?: StringWithAggregatesFilter<"ConsolidatedModel"> | string
    modelData?: StringWithAggregatesFilter<"ConsolidatedModel"> | string
    metadata?: StringNullableWithAggregatesFilter<"ConsolidatedModel"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ConsolidatedModel"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ConsolidatedModel"> | Date | string
  }

  export type ImportHistoryWhereInput = {
    AND?: ImportHistoryWhereInput | ImportHistoryWhereInput[]
    OR?: ImportHistoryWhereInput[]
    NOT?: ImportHistoryWhereInput | ImportHistoryWhereInput[]
    id?: StringFilter<"ImportHistory"> | string
    dataSourceId?: StringFilter<"ImportHistory"> | string
    fileName?: StringNullableFilter<"ImportHistory"> | string | null
    recordCount?: IntFilter<"ImportHistory"> | number
    status?: StringFilter<"ImportHistory"> | string
    error?: StringNullableFilter<"ImportHistory"> | string | null
    createdAt?: DateTimeFilter<"ImportHistory"> | Date | string
    completedAt?: DateTimeNullableFilter<"ImportHistory"> | Date | string | null
  }

  export type ImportHistoryOrderByWithRelationInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    fileName?: SortOrderInput | SortOrder
    recordCount?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
  }

  export type ImportHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ImportHistoryWhereInput | ImportHistoryWhereInput[]
    OR?: ImportHistoryWhereInput[]
    NOT?: ImportHistoryWhereInput | ImportHistoryWhereInput[]
    dataSourceId?: StringFilter<"ImportHistory"> | string
    fileName?: StringNullableFilter<"ImportHistory"> | string | null
    recordCount?: IntFilter<"ImportHistory"> | number
    status?: StringFilter<"ImportHistory"> | string
    error?: StringNullableFilter<"ImportHistory"> | string | null
    createdAt?: DateTimeFilter<"ImportHistory"> | Date | string
    completedAt?: DateTimeNullableFilter<"ImportHistory"> | Date | string | null
  }, "id">

  export type ImportHistoryOrderByWithAggregationInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    fileName?: SortOrderInput | SortOrder
    recordCount?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    _count?: ImportHistoryCountOrderByAggregateInput
    _avg?: ImportHistoryAvgOrderByAggregateInput
    _max?: ImportHistoryMaxOrderByAggregateInput
    _min?: ImportHistoryMinOrderByAggregateInput
    _sum?: ImportHistorySumOrderByAggregateInput
  }

  export type ImportHistoryScalarWhereWithAggregatesInput = {
    AND?: ImportHistoryScalarWhereWithAggregatesInput | ImportHistoryScalarWhereWithAggregatesInput[]
    OR?: ImportHistoryScalarWhereWithAggregatesInput[]
    NOT?: ImportHistoryScalarWhereWithAggregatesInput | ImportHistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ImportHistory"> | string
    dataSourceId?: StringWithAggregatesFilter<"ImportHistory"> | string
    fileName?: StringNullableWithAggregatesFilter<"ImportHistory"> | string | null
    recordCount?: IntWithAggregatesFilter<"ImportHistory"> | number
    status?: StringWithAggregatesFilter<"ImportHistory"> | string
    error?: StringNullableWithAggregatesFilter<"ImportHistory"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ImportHistory"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"ImportHistory"> | Date | string | null
  }

  export type DataSourceCreateInput = {
    id?: string
    name: string
    type: string
    config: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSyncAt?: Date | string | null
    snapshots?: SnapshotCreateNestedManyWithoutDataSourceInput
    relationships?: RelationshipCreateNestedManyWithoutSourceInput
    targetRelationships?: RelationshipCreateNestedManyWithoutTargetInput
  }

  export type DataSourceUncheckedCreateInput = {
    id?: string
    name: string
    type: string
    config: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSyncAt?: Date | string | null
    snapshots?: SnapshotUncheckedCreateNestedManyWithoutDataSourceInput
    relationships?: RelationshipUncheckedCreateNestedManyWithoutSourceInput
    targetRelationships?: RelationshipUncheckedCreateNestedManyWithoutTargetInput
  }

  export type DataSourceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    snapshots?: SnapshotUpdateManyWithoutDataSourceNestedInput
    relationships?: RelationshipUpdateManyWithoutSourceNestedInput
    targetRelationships?: RelationshipUpdateManyWithoutTargetNestedInput
  }

  export type DataSourceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    snapshots?: SnapshotUncheckedUpdateManyWithoutDataSourceNestedInput
    relationships?: RelationshipUncheckedUpdateManyWithoutSourceNestedInput
    targetRelationships?: RelationshipUncheckedUpdateManyWithoutTargetNestedInput
  }

  export type DataSourceCreateManyInput = {
    id?: string
    name: string
    type: string
    config: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSyncAt?: Date | string | null
  }

  export type DataSourceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type DataSourceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type SnapshotCreateInput = {
    id?: string
    data: string
    metadata?: string | null
    recordCount?: number
    createdAt?: Date | string
    dataSource: DataSourceCreateNestedOneWithoutSnapshotsInput
  }

  export type SnapshotUncheckedCreateInput = {
    id?: string
    dataSourceId: string
    data: string
    metadata?: string | null
    recordCount?: number
    createdAt?: Date | string
  }

  export type SnapshotUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataSource?: DataSourceUpdateOneRequiredWithoutSnapshotsNestedInput
  }

  export type SnapshotUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dataSourceId?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SnapshotCreateManyInput = {
    id?: string
    dataSourceId: string
    data: string
    metadata?: string | null
    recordCount?: number
    createdAt?: Date | string
  }

  export type SnapshotUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SnapshotUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    dataSourceId?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RelationshipCreateInput = {
    id?: string
    relationshipType: string
    metadata?: string | null
    createdAt?: Date | string
    source: DataSourceCreateNestedOneWithoutRelationshipsInput
    target: DataSourceCreateNestedOneWithoutTargetRelationshipsInput
  }

  export type RelationshipUncheckedCreateInput = {
    id?: string
    sourceId: string
    targetId: string
    relationshipType: string
    metadata?: string | null
    createdAt?: Date | string
  }

  export type RelationshipUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: DataSourceUpdateOneRequiredWithoutRelationshipsNestedInput
    target?: DataSourceUpdateOneRequiredWithoutTargetRelationshipsNestedInput
  }

  export type RelationshipUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: StringFieldUpdateOperationsInput | string
    targetId?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RelationshipCreateManyInput = {
    id?: string
    sourceId: string
    targetId: string
    relationshipType: string
    metadata?: string | null
    createdAt?: Date | string
  }

  export type RelationshipUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RelationshipUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: StringFieldUpdateOperationsInput | string
    targetId?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsolidatedModelCreateInput = {
    id?: string
    name: string
    modelData: string
    metadata?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConsolidatedModelUncheckedCreateInput = {
    id?: string
    name: string
    modelData: string
    metadata?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConsolidatedModelUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    modelData?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsolidatedModelUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    modelData?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsolidatedModelCreateManyInput = {
    id?: string
    name: string
    modelData: string
    metadata?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConsolidatedModelUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    modelData?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsolidatedModelUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    modelData?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ImportHistoryCreateInput = {
    id?: string
    dataSourceId: string
    fileName?: string | null
    recordCount?: number
    status?: string
    error?: string | null
    createdAt?: Date | string
    completedAt?: Date | string | null
  }

  export type ImportHistoryUncheckedCreateInput = {
    id?: string
    dataSourceId: string
    fileName?: string | null
    recordCount?: number
    status?: string
    error?: string | null
    createdAt?: Date | string
    completedAt?: Date | string | null
  }

  export type ImportHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dataSourceId?: StringFieldUpdateOperationsInput | string
    fileName?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ImportHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dataSourceId?: StringFieldUpdateOperationsInput | string
    fileName?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ImportHistoryCreateManyInput = {
    id?: string
    dataSourceId: string
    fileName?: string | null
    recordCount?: number
    status?: string
    error?: string | null
    createdAt?: Date | string
    completedAt?: Date | string | null
  }

  export type ImportHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    dataSourceId?: StringFieldUpdateOperationsInput | string
    fileName?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ImportHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    dataSourceId?: StringFieldUpdateOperationsInput | string
    fileName?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type SnapshotListRelationFilter = {
    every?: SnapshotWhereInput
    some?: SnapshotWhereInput
    none?: SnapshotWhereInput
  }

  export type RelationshipListRelationFilter = {
    every?: RelationshipWhereInput
    some?: RelationshipWhereInput
    none?: RelationshipWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SnapshotOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RelationshipOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DataSourceCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    config?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSyncAt?: SortOrder
  }

  export type DataSourceMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    config?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSyncAt?: SortOrder
  }

  export type DataSourceMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    config?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSyncAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DataSourceScalarRelationFilter = {
    is?: DataSourceWhereInput
    isNot?: DataSourceWhereInput
  }

  export type SnapshotCountOrderByAggregateInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    data?: SortOrder
    metadata?: SortOrder
    recordCount?: SortOrder
    createdAt?: SortOrder
  }

  export type SnapshotAvgOrderByAggregateInput = {
    recordCount?: SortOrder
  }

  export type SnapshotMaxOrderByAggregateInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    data?: SortOrder
    metadata?: SortOrder
    recordCount?: SortOrder
    createdAt?: SortOrder
  }

  export type SnapshotMinOrderByAggregateInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    data?: SortOrder
    metadata?: SortOrder
    recordCount?: SortOrder
    createdAt?: SortOrder
  }

  export type SnapshotSumOrderByAggregateInput = {
    recordCount?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type RelationshipCountOrderByAggregateInput = {
    id?: SortOrder
    sourceId?: SortOrder
    targetId?: SortOrder
    relationshipType?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type RelationshipMaxOrderByAggregateInput = {
    id?: SortOrder
    sourceId?: SortOrder
    targetId?: SortOrder
    relationshipType?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type RelationshipMinOrderByAggregateInput = {
    id?: SortOrder
    sourceId?: SortOrder
    targetId?: SortOrder
    relationshipType?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type ConsolidatedModelCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    modelData?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsolidatedModelMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    modelData?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsolidatedModelMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    modelData?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ImportHistoryCountOrderByAggregateInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    fileName?: SortOrder
    recordCount?: SortOrder
    status?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrder
  }

  export type ImportHistoryAvgOrderByAggregateInput = {
    recordCount?: SortOrder
  }

  export type ImportHistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    fileName?: SortOrder
    recordCount?: SortOrder
    status?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrder
  }

  export type ImportHistoryMinOrderByAggregateInput = {
    id?: SortOrder
    dataSourceId?: SortOrder
    fileName?: SortOrder
    recordCount?: SortOrder
    status?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrder
  }

  export type ImportHistorySumOrderByAggregateInput = {
    recordCount?: SortOrder
  }

  export type SnapshotCreateNestedManyWithoutDataSourceInput = {
    create?: XOR<SnapshotCreateWithoutDataSourceInput, SnapshotUncheckedCreateWithoutDataSourceInput> | SnapshotCreateWithoutDataSourceInput[] | SnapshotUncheckedCreateWithoutDataSourceInput[]
    connectOrCreate?: SnapshotCreateOrConnectWithoutDataSourceInput | SnapshotCreateOrConnectWithoutDataSourceInput[]
    createMany?: SnapshotCreateManyDataSourceInputEnvelope
    connect?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
  }

  export type RelationshipCreateNestedManyWithoutSourceInput = {
    create?: XOR<RelationshipCreateWithoutSourceInput, RelationshipUncheckedCreateWithoutSourceInput> | RelationshipCreateWithoutSourceInput[] | RelationshipUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: RelationshipCreateOrConnectWithoutSourceInput | RelationshipCreateOrConnectWithoutSourceInput[]
    createMany?: RelationshipCreateManySourceInputEnvelope
    connect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
  }

  export type RelationshipCreateNestedManyWithoutTargetInput = {
    create?: XOR<RelationshipCreateWithoutTargetInput, RelationshipUncheckedCreateWithoutTargetInput> | RelationshipCreateWithoutTargetInput[] | RelationshipUncheckedCreateWithoutTargetInput[]
    connectOrCreate?: RelationshipCreateOrConnectWithoutTargetInput | RelationshipCreateOrConnectWithoutTargetInput[]
    createMany?: RelationshipCreateManyTargetInputEnvelope
    connect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
  }

  export type SnapshotUncheckedCreateNestedManyWithoutDataSourceInput = {
    create?: XOR<SnapshotCreateWithoutDataSourceInput, SnapshotUncheckedCreateWithoutDataSourceInput> | SnapshotCreateWithoutDataSourceInput[] | SnapshotUncheckedCreateWithoutDataSourceInput[]
    connectOrCreate?: SnapshotCreateOrConnectWithoutDataSourceInput | SnapshotCreateOrConnectWithoutDataSourceInput[]
    createMany?: SnapshotCreateManyDataSourceInputEnvelope
    connect?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
  }

  export type RelationshipUncheckedCreateNestedManyWithoutSourceInput = {
    create?: XOR<RelationshipCreateWithoutSourceInput, RelationshipUncheckedCreateWithoutSourceInput> | RelationshipCreateWithoutSourceInput[] | RelationshipUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: RelationshipCreateOrConnectWithoutSourceInput | RelationshipCreateOrConnectWithoutSourceInput[]
    createMany?: RelationshipCreateManySourceInputEnvelope
    connect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
  }

  export type RelationshipUncheckedCreateNestedManyWithoutTargetInput = {
    create?: XOR<RelationshipCreateWithoutTargetInput, RelationshipUncheckedCreateWithoutTargetInput> | RelationshipCreateWithoutTargetInput[] | RelationshipUncheckedCreateWithoutTargetInput[]
    connectOrCreate?: RelationshipCreateOrConnectWithoutTargetInput | RelationshipCreateOrConnectWithoutTargetInput[]
    createMany?: RelationshipCreateManyTargetInputEnvelope
    connect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type SnapshotUpdateManyWithoutDataSourceNestedInput = {
    create?: XOR<SnapshotCreateWithoutDataSourceInput, SnapshotUncheckedCreateWithoutDataSourceInput> | SnapshotCreateWithoutDataSourceInput[] | SnapshotUncheckedCreateWithoutDataSourceInput[]
    connectOrCreate?: SnapshotCreateOrConnectWithoutDataSourceInput | SnapshotCreateOrConnectWithoutDataSourceInput[]
    upsert?: SnapshotUpsertWithWhereUniqueWithoutDataSourceInput | SnapshotUpsertWithWhereUniqueWithoutDataSourceInput[]
    createMany?: SnapshotCreateManyDataSourceInputEnvelope
    set?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
    disconnect?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
    delete?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
    connect?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
    update?: SnapshotUpdateWithWhereUniqueWithoutDataSourceInput | SnapshotUpdateWithWhereUniqueWithoutDataSourceInput[]
    updateMany?: SnapshotUpdateManyWithWhereWithoutDataSourceInput | SnapshotUpdateManyWithWhereWithoutDataSourceInput[]
    deleteMany?: SnapshotScalarWhereInput | SnapshotScalarWhereInput[]
  }

  export type RelationshipUpdateManyWithoutSourceNestedInput = {
    create?: XOR<RelationshipCreateWithoutSourceInput, RelationshipUncheckedCreateWithoutSourceInput> | RelationshipCreateWithoutSourceInput[] | RelationshipUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: RelationshipCreateOrConnectWithoutSourceInput | RelationshipCreateOrConnectWithoutSourceInput[]
    upsert?: RelationshipUpsertWithWhereUniqueWithoutSourceInput | RelationshipUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: RelationshipCreateManySourceInputEnvelope
    set?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    disconnect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    delete?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    connect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    update?: RelationshipUpdateWithWhereUniqueWithoutSourceInput | RelationshipUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: RelationshipUpdateManyWithWhereWithoutSourceInput | RelationshipUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: RelationshipScalarWhereInput | RelationshipScalarWhereInput[]
  }

  export type RelationshipUpdateManyWithoutTargetNestedInput = {
    create?: XOR<RelationshipCreateWithoutTargetInput, RelationshipUncheckedCreateWithoutTargetInput> | RelationshipCreateWithoutTargetInput[] | RelationshipUncheckedCreateWithoutTargetInput[]
    connectOrCreate?: RelationshipCreateOrConnectWithoutTargetInput | RelationshipCreateOrConnectWithoutTargetInput[]
    upsert?: RelationshipUpsertWithWhereUniqueWithoutTargetInput | RelationshipUpsertWithWhereUniqueWithoutTargetInput[]
    createMany?: RelationshipCreateManyTargetInputEnvelope
    set?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    disconnect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    delete?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    connect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    update?: RelationshipUpdateWithWhereUniqueWithoutTargetInput | RelationshipUpdateWithWhereUniqueWithoutTargetInput[]
    updateMany?: RelationshipUpdateManyWithWhereWithoutTargetInput | RelationshipUpdateManyWithWhereWithoutTargetInput[]
    deleteMany?: RelationshipScalarWhereInput | RelationshipScalarWhereInput[]
  }

  export type SnapshotUncheckedUpdateManyWithoutDataSourceNestedInput = {
    create?: XOR<SnapshotCreateWithoutDataSourceInput, SnapshotUncheckedCreateWithoutDataSourceInput> | SnapshotCreateWithoutDataSourceInput[] | SnapshotUncheckedCreateWithoutDataSourceInput[]
    connectOrCreate?: SnapshotCreateOrConnectWithoutDataSourceInput | SnapshotCreateOrConnectWithoutDataSourceInput[]
    upsert?: SnapshotUpsertWithWhereUniqueWithoutDataSourceInput | SnapshotUpsertWithWhereUniqueWithoutDataSourceInput[]
    createMany?: SnapshotCreateManyDataSourceInputEnvelope
    set?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
    disconnect?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
    delete?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
    connect?: SnapshotWhereUniqueInput | SnapshotWhereUniqueInput[]
    update?: SnapshotUpdateWithWhereUniqueWithoutDataSourceInput | SnapshotUpdateWithWhereUniqueWithoutDataSourceInput[]
    updateMany?: SnapshotUpdateManyWithWhereWithoutDataSourceInput | SnapshotUpdateManyWithWhereWithoutDataSourceInput[]
    deleteMany?: SnapshotScalarWhereInput | SnapshotScalarWhereInput[]
  }

  export type RelationshipUncheckedUpdateManyWithoutSourceNestedInput = {
    create?: XOR<RelationshipCreateWithoutSourceInput, RelationshipUncheckedCreateWithoutSourceInput> | RelationshipCreateWithoutSourceInput[] | RelationshipUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: RelationshipCreateOrConnectWithoutSourceInput | RelationshipCreateOrConnectWithoutSourceInput[]
    upsert?: RelationshipUpsertWithWhereUniqueWithoutSourceInput | RelationshipUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: RelationshipCreateManySourceInputEnvelope
    set?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    disconnect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    delete?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    connect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    update?: RelationshipUpdateWithWhereUniqueWithoutSourceInput | RelationshipUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: RelationshipUpdateManyWithWhereWithoutSourceInput | RelationshipUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: RelationshipScalarWhereInput | RelationshipScalarWhereInput[]
  }

  export type RelationshipUncheckedUpdateManyWithoutTargetNestedInput = {
    create?: XOR<RelationshipCreateWithoutTargetInput, RelationshipUncheckedCreateWithoutTargetInput> | RelationshipCreateWithoutTargetInput[] | RelationshipUncheckedCreateWithoutTargetInput[]
    connectOrCreate?: RelationshipCreateOrConnectWithoutTargetInput | RelationshipCreateOrConnectWithoutTargetInput[]
    upsert?: RelationshipUpsertWithWhereUniqueWithoutTargetInput | RelationshipUpsertWithWhereUniqueWithoutTargetInput[]
    createMany?: RelationshipCreateManyTargetInputEnvelope
    set?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    disconnect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    delete?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    connect?: RelationshipWhereUniqueInput | RelationshipWhereUniqueInput[]
    update?: RelationshipUpdateWithWhereUniqueWithoutTargetInput | RelationshipUpdateWithWhereUniqueWithoutTargetInput[]
    updateMany?: RelationshipUpdateManyWithWhereWithoutTargetInput | RelationshipUpdateManyWithWhereWithoutTargetInput[]
    deleteMany?: RelationshipScalarWhereInput | RelationshipScalarWhereInput[]
  }

  export type DataSourceCreateNestedOneWithoutSnapshotsInput = {
    create?: XOR<DataSourceCreateWithoutSnapshotsInput, DataSourceUncheckedCreateWithoutSnapshotsInput>
    connectOrCreate?: DataSourceCreateOrConnectWithoutSnapshotsInput
    connect?: DataSourceWhereUniqueInput
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DataSourceUpdateOneRequiredWithoutSnapshotsNestedInput = {
    create?: XOR<DataSourceCreateWithoutSnapshotsInput, DataSourceUncheckedCreateWithoutSnapshotsInput>
    connectOrCreate?: DataSourceCreateOrConnectWithoutSnapshotsInput
    upsert?: DataSourceUpsertWithoutSnapshotsInput
    connect?: DataSourceWhereUniqueInput
    update?: XOR<XOR<DataSourceUpdateToOneWithWhereWithoutSnapshotsInput, DataSourceUpdateWithoutSnapshotsInput>, DataSourceUncheckedUpdateWithoutSnapshotsInput>
  }

  export type DataSourceCreateNestedOneWithoutRelationshipsInput = {
    create?: XOR<DataSourceCreateWithoutRelationshipsInput, DataSourceUncheckedCreateWithoutRelationshipsInput>
    connectOrCreate?: DataSourceCreateOrConnectWithoutRelationshipsInput
    connect?: DataSourceWhereUniqueInput
  }

  export type DataSourceCreateNestedOneWithoutTargetRelationshipsInput = {
    create?: XOR<DataSourceCreateWithoutTargetRelationshipsInput, DataSourceUncheckedCreateWithoutTargetRelationshipsInput>
    connectOrCreate?: DataSourceCreateOrConnectWithoutTargetRelationshipsInput
    connect?: DataSourceWhereUniqueInput
  }

  export type DataSourceUpdateOneRequiredWithoutRelationshipsNestedInput = {
    create?: XOR<DataSourceCreateWithoutRelationshipsInput, DataSourceUncheckedCreateWithoutRelationshipsInput>
    connectOrCreate?: DataSourceCreateOrConnectWithoutRelationshipsInput
    upsert?: DataSourceUpsertWithoutRelationshipsInput
    connect?: DataSourceWhereUniqueInput
    update?: XOR<XOR<DataSourceUpdateToOneWithWhereWithoutRelationshipsInput, DataSourceUpdateWithoutRelationshipsInput>, DataSourceUncheckedUpdateWithoutRelationshipsInput>
  }

  export type DataSourceUpdateOneRequiredWithoutTargetRelationshipsNestedInput = {
    create?: XOR<DataSourceCreateWithoutTargetRelationshipsInput, DataSourceUncheckedCreateWithoutTargetRelationshipsInput>
    connectOrCreate?: DataSourceCreateOrConnectWithoutTargetRelationshipsInput
    upsert?: DataSourceUpsertWithoutTargetRelationshipsInput
    connect?: DataSourceWhereUniqueInput
    update?: XOR<XOR<DataSourceUpdateToOneWithWhereWithoutTargetRelationshipsInput, DataSourceUpdateWithoutTargetRelationshipsInput>, DataSourceUncheckedUpdateWithoutTargetRelationshipsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type SnapshotCreateWithoutDataSourceInput = {
    id?: string
    data: string
    metadata?: string | null
    recordCount?: number
    createdAt?: Date | string
  }

  export type SnapshotUncheckedCreateWithoutDataSourceInput = {
    id?: string
    data: string
    metadata?: string | null
    recordCount?: number
    createdAt?: Date | string
  }

  export type SnapshotCreateOrConnectWithoutDataSourceInput = {
    where: SnapshotWhereUniqueInput
    create: XOR<SnapshotCreateWithoutDataSourceInput, SnapshotUncheckedCreateWithoutDataSourceInput>
  }

  export type SnapshotCreateManyDataSourceInputEnvelope = {
    data: SnapshotCreateManyDataSourceInput | SnapshotCreateManyDataSourceInput[]
  }

  export type RelationshipCreateWithoutSourceInput = {
    id?: string
    relationshipType: string
    metadata?: string | null
    createdAt?: Date | string
    target: DataSourceCreateNestedOneWithoutTargetRelationshipsInput
  }

  export type RelationshipUncheckedCreateWithoutSourceInput = {
    id?: string
    targetId: string
    relationshipType: string
    metadata?: string | null
    createdAt?: Date | string
  }

  export type RelationshipCreateOrConnectWithoutSourceInput = {
    where: RelationshipWhereUniqueInput
    create: XOR<RelationshipCreateWithoutSourceInput, RelationshipUncheckedCreateWithoutSourceInput>
  }

  export type RelationshipCreateManySourceInputEnvelope = {
    data: RelationshipCreateManySourceInput | RelationshipCreateManySourceInput[]
  }

  export type RelationshipCreateWithoutTargetInput = {
    id?: string
    relationshipType: string
    metadata?: string | null
    createdAt?: Date | string
    source: DataSourceCreateNestedOneWithoutRelationshipsInput
  }

  export type RelationshipUncheckedCreateWithoutTargetInput = {
    id?: string
    sourceId: string
    relationshipType: string
    metadata?: string | null
    createdAt?: Date | string
  }

  export type RelationshipCreateOrConnectWithoutTargetInput = {
    where: RelationshipWhereUniqueInput
    create: XOR<RelationshipCreateWithoutTargetInput, RelationshipUncheckedCreateWithoutTargetInput>
  }

  export type RelationshipCreateManyTargetInputEnvelope = {
    data: RelationshipCreateManyTargetInput | RelationshipCreateManyTargetInput[]
  }

  export type SnapshotUpsertWithWhereUniqueWithoutDataSourceInput = {
    where: SnapshotWhereUniqueInput
    update: XOR<SnapshotUpdateWithoutDataSourceInput, SnapshotUncheckedUpdateWithoutDataSourceInput>
    create: XOR<SnapshotCreateWithoutDataSourceInput, SnapshotUncheckedCreateWithoutDataSourceInput>
  }

  export type SnapshotUpdateWithWhereUniqueWithoutDataSourceInput = {
    where: SnapshotWhereUniqueInput
    data: XOR<SnapshotUpdateWithoutDataSourceInput, SnapshotUncheckedUpdateWithoutDataSourceInput>
  }

  export type SnapshotUpdateManyWithWhereWithoutDataSourceInput = {
    where: SnapshotScalarWhereInput
    data: XOR<SnapshotUpdateManyMutationInput, SnapshotUncheckedUpdateManyWithoutDataSourceInput>
  }

  export type SnapshotScalarWhereInput = {
    AND?: SnapshotScalarWhereInput | SnapshotScalarWhereInput[]
    OR?: SnapshotScalarWhereInput[]
    NOT?: SnapshotScalarWhereInput | SnapshotScalarWhereInput[]
    id?: StringFilter<"Snapshot"> | string
    dataSourceId?: StringFilter<"Snapshot"> | string
    data?: StringFilter<"Snapshot"> | string
    metadata?: StringNullableFilter<"Snapshot"> | string | null
    recordCount?: IntFilter<"Snapshot"> | number
    createdAt?: DateTimeFilter<"Snapshot"> | Date | string
  }

  export type RelationshipUpsertWithWhereUniqueWithoutSourceInput = {
    where: RelationshipWhereUniqueInput
    update: XOR<RelationshipUpdateWithoutSourceInput, RelationshipUncheckedUpdateWithoutSourceInput>
    create: XOR<RelationshipCreateWithoutSourceInput, RelationshipUncheckedCreateWithoutSourceInput>
  }

  export type RelationshipUpdateWithWhereUniqueWithoutSourceInput = {
    where: RelationshipWhereUniqueInput
    data: XOR<RelationshipUpdateWithoutSourceInput, RelationshipUncheckedUpdateWithoutSourceInput>
  }

  export type RelationshipUpdateManyWithWhereWithoutSourceInput = {
    where: RelationshipScalarWhereInput
    data: XOR<RelationshipUpdateManyMutationInput, RelationshipUncheckedUpdateManyWithoutSourceInput>
  }

  export type RelationshipScalarWhereInput = {
    AND?: RelationshipScalarWhereInput | RelationshipScalarWhereInput[]
    OR?: RelationshipScalarWhereInput[]
    NOT?: RelationshipScalarWhereInput | RelationshipScalarWhereInput[]
    id?: StringFilter<"Relationship"> | string
    sourceId?: StringFilter<"Relationship"> | string
    targetId?: StringFilter<"Relationship"> | string
    relationshipType?: StringFilter<"Relationship"> | string
    metadata?: StringNullableFilter<"Relationship"> | string | null
    createdAt?: DateTimeFilter<"Relationship"> | Date | string
  }

  export type RelationshipUpsertWithWhereUniqueWithoutTargetInput = {
    where: RelationshipWhereUniqueInput
    update: XOR<RelationshipUpdateWithoutTargetInput, RelationshipUncheckedUpdateWithoutTargetInput>
    create: XOR<RelationshipCreateWithoutTargetInput, RelationshipUncheckedCreateWithoutTargetInput>
  }

  export type RelationshipUpdateWithWhereUniqueWithoutTargetInput = {
    where: RelationshipWhereUniqueInput
    data: XOR<RelationshipUpdateWithoutTargetInput, RelationshipUncheckedUpdateWithoutTargetInput>
  }

  export type RelationshipUpdateManyWithWhereWithoutTargetInput = {
    where: RelationshipScalarWhereInput
    data: XOR<RelationshipUpdateManyMutationInput, RelationshipUncheckedUpdateManyWithoutTargetInput>
  }

  export type DataSourceCreateWithoutSnapshotsInput = {
    id?: string
    name: string
    type: string
    config: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSyncAt?: Date | string | null
    relationships?: RelationshipCreateNestedManyWithoutSourceInput
    targetRelationships?: RelationshipCreateNestedManyWithoutTargetInput
  }

  export type DataSourceUncheckedCreateWithoutSnapshotsInput = {
    id?: string
    name: string
    type: string
    config: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSyncAt?: Date | string | null
    relationships?: RelationshipUncheckedCreateNestedManyWithoutSourceInput
    targetRelationships?: RelationshipUncheckedCreateNestedManyWithoutTargetInput
  }

  export type DataSourceCreateOrConnectWithoutSnapshotsInput = {
    where: DataSourceWhereUniqueInput
    create: XOR<DataSourceCreateWithoutSnapshotsInput, DataSourceUncheckedCreateWithoutSnapshotsInput>
  }

  export type DataSourceUpsertWithoutSnapshotsInput = {
    update: XOR<DataSourceUpdateWithoutSnapshotsInput, DataSourceUncheckedUpdateWithoutSnapshotsInput>
    create: XOR<DataSourceCreateWithoutSnapshotsInput, DataSourceUncheckedCreateWithoutSnapshotsInput>
    where?: DataSourceWhereInput
  }

  export type DataSourceUpdateToOneWithWhereWithoutSnapshotsInput = {
    where?: DataSourceWhereInput
    data: XOR<DataSourceUpdateWithoutSnapshotsInput, DataSourceUncheckedUpdateWithoutSnapshotsInput>
  }

  export type DataSourceUpdateWithoutSnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    relationships?: RelationshipUpdateManyWithoutSourceNestedInput
    targetRelationships?: RelationshipUpdateManyWithoutTargetNestedInput
  }

  export type DataSourceUncheckedUpdateWithoutSnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    relationships?: RelationshipUncheckedUpdateManyWithoutSourceNestedInput
    targetRelationships?: RelationshipUncheckedUpdateManyWithoutTargetNestedInput
  }

  export type DataSourceCreateWithoutRelationshipsInput = {
    id?: string
    name: string
    type: string
    config: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSyncAt?: Date | string | null
    snapshots?: SnapshotCreateNestedManyWithoutDataSourceInput
    targetRelationships?: RelationshipCreateNestedManyWithoutTargetInput
  }

  export type DataSourceUncheckedCreateWithoutRelationshipsInput = {
    id?: string
    name: string
    type: string
    config: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSyncAt?: Date | string | null
    snapshots?: SnapshotUncheckedCreateNestedManyWithoutDataSourceInput
    targetRelationships?: RelationshipUncheckedCreateNestedManyWithoutTargetInput
  }

  export type DataSourceCreateOrConnectWithoutRelationshipsInput = {
    where: DataSourceWhereUniqueInput
    create: XOR<DataSourceCreateWithoutRelationshipsInput, DataSourceUncheckedCreateWithoutRelationshipsInput>
  }

  export type DataSourceCreateWithoutTargetRelationshipsInput = {
    id?: string
    name: string
    type: string
    config: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSyncAt?: Date | string | null
    snapshots?: SnapshotCreateNestedManyWithoutDataSourceInput
    relationships?: RelationshipCreateNestedManyWithoutSourceInput
  }

  export type DataSourceUncheckedCreateWithoutTargetRelationshipsInput = {
    id?: string
    name: string
    type: string
    config: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSyncAt?: Date | string | null
    snapshots?: SnapshotUncheckedCreateNestedManyWithoutDataSourceInput
    relationships?: RelationshipUncheckedCreateNestedManyWithoutSourceInput
  }

  export type DataSourceCreateOrConnectWithoutTargetRelationshipsInput = {
    where: DataSourceWhereUniqueInput
    create: XOR<DataSourceCreateWithoutTargetRelationshipsInput, DataSourceUncheckedCreateWithoutTargetRelationshipsInput>
  }

  export type DataSourceUpsertWithoutRelationshipsInput = {
    update: XOR<DataSourceUpdateWithoutRelationshipsInput, DataSourceUncheckedUpdateWithoutRelationshipsInput>
    create: XOR<DataSourceCreateWithoutRelationshipsInput, DataSourceUncheckedCreateWithoutRelationshipsInput>
    where?: DataSourceWhereInput
  }

  export type DataSourceUpdateToOneWithWhereWithoutRelationshipsInput = {
    where?: DataSourceWhereInput
    data: XOR<DataSourceUpdateWithoutRelationshipsInput, DataSourceUncheckedUpdateWithoutRelationshipsInput>
  }

  export type DataSourceUpdateWithoutRelationshipsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    snapshots?: SnapshotUpdateManyWithoutDataSourceNestedInput
    targetRelationships?: RelationshipUpdateManyWithoutTargetNestedInput
  }

  export type DataSourceUncheckedUpdateWithoutRelationshipsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    snapshots?: SnapshotUncheckedUpdateManyWithoutDataSourceNestedInput
    targetRelationships?: RelationshipUncheckedUpdateManyWithoutTargetNestedInput
  }

  export type DataSourceUpsertWithoutTargetRelationshipsInput = {
    update: XOR<DataSourceUpdateWithoutTargetRelationshipsInput, DataSourceUncheckedUpdateWithoutTargetRelationshipsInput>
    create: XOR<DataSourceCreateWithoutTargetRelationshipsInput, DataSourceUncheckedCreateWithoutTargetRelationshipsInput>
    where?: DataSourceWhereInput
  }

  export type DataSourceUpdateToOneWithWhereWithoutTargetRelationshipsInput = {
    where?: DataSourceWhereInput
    data: XOR<DataSourceUpdateWithoutTargetRelationshipsInput, DataSourceUncheckedUpdateWithoutTargetRelationshipsInput>
  }

  export type DataSourceUpdateWithoutTargetRelationshipsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    snapshots?: SnapshotUpdateManyWithoutDataSourceNestedInput
    relationships?: RelationshipUpdateManyWithoutSourceNestedInput
  }

  export type DataSourceUncheckedUpdateWithoutTargetRelationshipsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    config?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    snapshots?: SnapshotUncheckedUpdateManyWithoutDataSourceNestedInput
    relationships?: RelationshipUncheckedUpdateManyWithoutSourceNestedInput
  }

  export type SnapshotCreateManyDataSourceInput = {
    id?: string
    data: string
    metadata?: string | null
    recordCount?: number
    createdAt?: Date | string
  }

  export type RelationshipCreateManySourceInput = {
    id?: string
    targetId: string
    relationshipType: string
    metadata?: string | null
    createdAt?: Date | string
  }

  export type RelationshipCreateManyTargetInput = {
    id?: string
    sourceId: string
    relationshipType: string
    metadata?: string | null
    createdAt?: Date | string
  }

  export type SnapshotUpdateWithoutDataSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SnapshotUncheckedUpdateWithoutDataSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SnapshotUncheckedUpdateManyWithoutDataSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    recordCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RelationshipUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    target?: DataSourceUpdateOneRequiredWithoutTargetRelationshipsNestedInput
  }

  export type RelationshipUncheckedUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetId?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RelationshipUncheckedUpdateManyWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetId?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RelationshipUpdateWithoutTargetInput = {
    id?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: DataSourceUpdateOneRequiredWithoutRelationshipsNestedInput
  }

  export type RelationshipUncheckedUpdateWithoutTargetInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RelationshipUncheckedUpdateManyWithoutTargetInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: StringFieldUpdateOperationsInput | string
    relationshipType?: StringFieldUpdateOperationsInput | string
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}