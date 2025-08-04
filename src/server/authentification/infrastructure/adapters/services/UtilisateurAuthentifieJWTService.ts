import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import { ProfilRepository } from "@/server/authentification/domain/ports/ProfilRepository";
import { UtilisateurAuthentifie } from "@/server/authentification/domain/UtilisateurAuthentifie";
import { TokenAPIJWTService } from "@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService";
import { TokenAPIInformationRepository } from "@/server/authentification/domain/ports/TokenAPIInformationRepository";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";
import { configuration } from "@/config";

export class UtilisateurAuthentifieJWTService {
  private readonly utilisateurRepository: UtilisateurRepository;

  private readonly tokenAPIRepository: TokenAPIInformationRepository;

  private readonly profilRepository: ProfilRepository;

  constructor({
    utilisateurRepository,
    tokenAPIRepository,
    profilRepository,
  }: {
    utilisateurRepository: UtilisateurRepository;
    tokenAPIRepository: TokenAPIInformationRepository;
    profilRepository: ProfilRepository;
  }) {
    this.utilisateurRepository = utilisateurRepository;
    this.tokenAPIRepository = tokenAPIRepository;
    this.profilRepository = profilRepository;
  }

  async recupererUtilisateurAuthentifie(
    tokenJWT: string,
  ): Promise<UtilisateurAuthentifie> {
    const decodedToken = await new TokenAPIJWTService({
      secret: configuration.tokenAPI.secret,
    }).decoderTokenAPI(tokenJWT);
    const email = decodedToken?.email!;
    const utilisateur = await this.utilisateurRepository.récupérer(email);

    const utilisateurDuToken =
      await this.tokenAPIRepository.recupererTokenAPIInformation({ email });

    if (!utilisateur || !utilisateurDuToken) {
      throw new ForbiddenError(
        "L'utilisateur n'existe pas ou plus dans la base de données utilisateur de pilote",
      );
    }

    const estAutoriseAAccederAuxChantiersBrouillons =
      await this.profilRepository.estAutoriseAAccederAuxChantiersBrouillons({
        profilCode: utilisateur.profil,
      });

    return UtilisateurAuthentifie.creerUtilisateurAuthentifie({
      id: utilisateur.id,
      email,
      profil: utilisateur.profil,
      habilitations: utilisateur.habilitations,
      profilAAccèsAuxChantiersBrouillons:
        estAutoriseAAccederAuxChantiersBrouillons,
    });
  }
}
