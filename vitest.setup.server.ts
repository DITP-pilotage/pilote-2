import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import * as matchers from 'jest-extended';
import { expect } from 'vitest';

expect.extend(matchers);
