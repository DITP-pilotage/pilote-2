import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import '@testing-library/jest-dom/vitest';
import * as matchers from 'jest-extended';
import { expect } from 'vitest';

expect.extend(matchers);
