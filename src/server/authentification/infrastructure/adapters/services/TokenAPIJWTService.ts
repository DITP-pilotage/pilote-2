import { decode, encode } from "next-auth/jwt";
import { TokenAPIService } from "@/server/authentification/domain/ports/TokenAPIService";
import { TokenAPIInformation } from "@/server/authentification/domain/TokenAPIInformation";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";
import logger from "@/server/infrastructure/Logger";

export class TokenAPIJWTService implements TokenAPIService {
  private readonly secret: string;

  constructor({ secret }: { secret: string }) {
    this.secret = secret;
  }

  async creerTokenAPI({ email }: TokenAPIInformation): Promise<string> {
    return encode({
      token: { email },
      secret: this.secret,
      maxAge: 365 * 24 * 60 * 60,
      salt: "authjs.session-token",
    });
  }

  async decoderTokenAPI(
    token: string,
  ): Promise<TokenAPIInformation | undefined> {
    try {
      return await decode({
        token,
        secret: this.secret,
        salt: "authjs.session-token",
      }).then((decodedJWT) => {
        if (decodedJWT) {
          return TokenAPIInformation.creerTokenAPIInformation({
            email: decodedJWT.email as string,
            dateCreation: "",
          });
        }
      });
    } catch (error) {
      logger.warn(
        {
          categorie: "auth",
          source: "TokenAPIJWTService.decoderTokenAPI",
          errorMessage: (error as Error).message,
        },
        "Échec du décodage du token API JWT",
      );
      throw new BadRequestError(
        "Le token n'a pas pu être décodé, veuillez vérifier qu'il est conforme au format JWT",
      );
    }
  }
}
