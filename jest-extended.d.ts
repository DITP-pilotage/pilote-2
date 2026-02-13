import type { Matchers as JestExtendedMatchers } from 'jest-extended';
import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> extends JestExtendedMatchers<T> {}
  interface AsymmetricMatchersContaining extends JestExtendedMatchers {}
}
