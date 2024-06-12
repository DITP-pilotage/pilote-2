import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { ProfilRepository } from '@/server/authentification/domain/ports/ProfilRepository';
import { UtilisateurAuthentifie } from '@/server/authentification/domain/UtilisateurAuthentifie';
import { TokenAPIJWTService } from '@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService';

export class UtilisateurAuthentifieJWTService {
  private readonly utilisateurRepository: UtilisateurRepository;

  private readonly profilRepository: ProfilRepository;

  constructor({ utilisateurRepository, profilRepository }: {
    utilisateurRepository: UtilisateurRepository,
    profilRepository: ProfilRepository
  }) {
    this.utilisateurRepository = utilisateurRepository;
    this.profilRepository = profilRepository;
  }

  async recupererUtilisateurAuthentifie(tokenJWT: string): Promise<UtilisateurAuthentifie> {
    const decodedToken = await new TokenAPIJWTService({ secret: process.env.TOKEN_API_SECRET! }).decoderTokenAPI(tokenJWT);
    const email = decodedToken?.email!;
    const utilisateur = await this.utilisateurRepository.récupérer(email);

    if (!utilisateur) {
      throw new Error('L\'utilisateur n\'existe pas ou plus dans la base de données utilisateur de pilote');
    }

    const estAutoriseAAccederAuxChantiersBrouillons = await this.profilRepository.estAutoriseAAccederAuxChantiersBrouillons({ profilCode: utilisateur.profil });

    return UtilisateurAuthentifie.creerUtilisateurAuthentifie({
      email,
      profil: utilisateur.profil,
      habilitations: utilisateur.habilitations,
      profilAAccèsAuxChantiersBrouillons: estAutoriseAAccederAuxChantiersBrouillons,
    });
  }
}
