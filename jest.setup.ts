import "@testing-library/jest-dom";

import { TextEncoder, TextDecoder } from "node:util";

global.TextEncoder = TextEncoder as never;
global.TextDecoder = TextDecoder as never;
