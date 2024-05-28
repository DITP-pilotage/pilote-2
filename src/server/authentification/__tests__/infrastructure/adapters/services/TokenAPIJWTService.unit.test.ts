import { decode } from 'next-auth/jwt';
import { TokenAPIJWTService } from '@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService';

describe('TokenAPIJWTService', () => {
  let tokenAPIJWTService: TokenAPIJWTService;

  beforeEach(() => {
    tokenAPIJWTService = new TokenAPIJWTService({ secret: 'secret' });
  });

  describe('creerTokenAPI', () => {
    it('doit générer un token api au format JWT', async () => {
      // Given
      const email = 'test@example.com';
      // When
      const result = await tokenAPIJWTService.creerTokenAPI({ email });
      // Then
      const tokenDecode = await decode({ token: result, secret: 'secret' });
      expect(tokenDecode?.email).toEqual('test@example.com');
    });
  });
});
