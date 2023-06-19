export function testDouble<T>(fakeFunctions = {}): T {
  const result: any = {}; // any = ok pour ce code tooling, à éviter pour code applicatif
  for (const [key, value] of Object.entries(fakeFunctions)) {
    result[key] = value;
  }
  return result as T;
}
