import type CustomMatchers from 'jest-extended'

// Les matchers de `jest-extended` sont branchés sur `expect` dans `src/test/setup.ts` ;
// ces augmentations les rendent visibles au typage côté vitest.
declare module 'vitest' {
  /* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
  /* eslint-enable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
}
