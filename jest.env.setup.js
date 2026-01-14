const envFile = process.env.CI ? ".env.ci" : ".env.test";
require("dotenv").config({ path: envFile });
require("dotenv").config();
