type ValueType = {
  [key: string]: unknown;
};
function isObject(value: unknown): value is ValueType {
  return typeof value === "object" && value !== null;
}
function removeKeys<T>(obj: object, keys: string[]): T {
  const newObj = { ...obj };
  keys.forEach((key) => delete newObj[key as keyof typeof newObj]);
  return newObj as T;
}
function mergeDeep(target: any, ...sources: any[]) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
export { isObject, removeKeys, mergeDeep };
