/**
 * Minimal Reflect metadata API (the part of the `reflect-metadata` polyfill
 * that tsyringe and TypeScript's emitted decorator metadata use), installed
 * by a plain function call — see webauthn.ts for why the npm package can't
 * be relied on here. Metadata is kept per target object (and property) in a
 * WeakMap, and lookups walk the prototype chain like the real thing.
 */
type Prop = string | symbol | undefined;
type Table = Map<Prop, Map<unknown, unknown>>;

const store = new WeakMap<object, Table>();

function table(target: object, prop: Prop, create: boolean): Map<unknown, unknown> | undefined {
  let byProp = store.get(target);
  if (!byProp) {
    if (!create) return undefined;
    byProp = new Map();
    store.set(target, byProp);
  }
  let entries = byProp.get(prop);
  if (!entries && create) {
    entries = new Map();
    byProp.set(prop, entries);
  }
  return entries;
}

function* chain(target: object | null): Generator<object> {
  for (let t = target; t; t = Object.getPrototypeOf(t) as object | null) yield t;
}

export function installReflectMetadata(): void {
  const R = Reflect as unknown as Record<string, unknown>;
  if (typeof R["getMetadata"] === "function") return;

  const defineMetadata = (key: unknown, value: unknown, target: object, prop?: Prop) => {
    table(target, prop, true)!.set(key, value);
  };
  const hasOwnMetadata = (key: unknown, target: object, prop?: Prop) =>
    table(target, prop, false)?.has(key) ?? false;
  const getOwnMetadata = (key: unknown, target: object, prop?: Prop) =>
    table(target, prop, false)?.get(key);
  const getOwnMetadataKeys = (target: object, prop?: Prop) => [
    ...(table(target, prop, false)?.keys() ?? []),
  ];

  Object.assign(R, {
    defineMetadata,
    hasOwnMetadata,
    getOwnMetadata,
    getOwnMetadataKeys,
    hasMetadata: (key: unknown, target: object, prop?: Prop) =>
      [...chain(target)].some((t) => hasOwnMetadata(key, t, prop)),
    getMetadata: (key: unknown, target: object, prop?: Prop) => {
      for (const t of chain(target))
        if (hasOwnMetadata(key, t, prop)) return getOwnMetadata(key, t, prop);
      return undefined;
    },
    getMetadataKeys: (target: object, prop?: Prop) => [
      ...new Set([...chain(target)].flatMap((t) => getOwnMetadataKeys(t, prop))),
    ],
    deleteMetadata: (key: unknown, target: object, prop?: Prop) =>
      table(target, prop, false)?.delete(key) ?? false,
    metadata: (key: unknown, value: unknown) => (target: object, prop?: Prop) =>
      defineMetadata(key, value, target, prop),
  });
}
