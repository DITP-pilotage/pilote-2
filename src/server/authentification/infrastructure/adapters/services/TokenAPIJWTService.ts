import { encode } from 'next-auth/jwt';
import { TokenAPIService } from '@/server/authentification/domain/ports/TokenAPIService';

export class TokenAPIJWTService implements TokenAPIService {
  private readonly secret: string;

  constructor({ secret }: { secret: string }) {
    this.secret = secret;
  }

  async creerTokenAPI({ email }: { email: string }): Promise<string> {
    return encode({ token: { email }, secret: this.secret });
  }
}
