import { decode, encode } from 'next-auth/jwt';
import { TokenAPIService } from '@/server/authentification/domain/ports/TokenAPIService';
import { TokenAPIInformation } from '@/server/authentification/domain/TokenAPIInformation';

export class TokenAPIJWTService implements TokenAPIService {
  private readonly secret: string;

  constructor({ secret }: { secret: string }) {
    this.secret = secret;
  }

  async creerTokenAPI({ email }: TokenAPIInformation): Promise<string> {
    return encode({ token: { email }, secret: this.secret });
  }

  async decoderTokenAPI(token: string): Promise<TokenAPIInformation | undefined> {
    return decode({ token: token, secret: process.env.TOKEN_API_SECRET || 'error' }).then(decodedJWT => {
      if (decodedJWT) {
        return TokenAPIInformation.creerTokenAPIInformation({
          email: decodedJWT.email as string,
          dateCreation: '',
        });
      }
    });
  }
}
