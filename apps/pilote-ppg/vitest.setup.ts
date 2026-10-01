import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import '@testing-library/jest-dom/vitest';
import * as matchers from 'jest-extended';
import { expect } from 'vitest';

expect.extend(matchers);

// jsdom n'implémente pas la capture de pointeur ni scrollIntoView, dont les
// composants radix (Select) ont besoin pour s'ouvrir.
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}
