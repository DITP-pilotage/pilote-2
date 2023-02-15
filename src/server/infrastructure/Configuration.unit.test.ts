import { Configuration } from '@/server/infrastructure/Configuration';
import ProcessEnv = NodeJS.ProcessEnv;

function testProcessEnv(obj: object): ProcessEnv {
  return {
    NODE_ENV: 'test',
    ...obj,
  };
}

describe('Configuration', () => {
  test("utilise la BDD si la variable d'env est 'true'", () => {
    // GIVEN WHEN
    const config = new Configuration(testProcessEnv({ USE_DATABASE: 'true' }));
    // THEN
    expect(config.isUsingDatabase).toBe(true);
  });

  test("N'utilise pas la BDD si la variable d'env est absente", () => {
    // GIVEN WHEN
    const config = new Configuration(testProcessEnv({}));
    // THEN
    expect(config.isUsingDatabase).toBe(false);
  });

  test("N'utilise pas la BDD si la variable d'env a une valeur autre", () => {
    // GIVEN WHEN
    const config = new Configuration(testProcessEnv({ USE_DATABASE: 1 }));
    // THEN
    expect(config.isUsingDatabase).toBe(false);
  });
});

