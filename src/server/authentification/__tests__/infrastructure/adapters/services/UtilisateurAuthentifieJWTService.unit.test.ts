import { mock, MockProxy } from 'jest-mock-extended';
import { TokenAPIJWTService } from '@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService';
import { TokenAPIInformationBuilder } from '@/server/authentification/app/builder/TokenAPIInformationBuilder';
import { UtilisateurBuilder } from '@/server/authentification/app/builder/UtilisateurBuilder';
import {
  HabilitationAuthentitificationAPIBuilder,
} from '@/server/authentification/app/builder/HabilitationAuthentitificationAPIBuilder';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { ProfilRepository } from '@/server/authentification/domain/ports/ProfilRepository';
import {
  UtilisateurAuthentifieJWTService,
} from '@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService';

describe('UtilisateurAuthentifieJWTService', () => {
  let utilisateurAuthentifieJWTService: UtilisateurAuthentifieJWTService;
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let profilRepository: MockProxy<ProfilRepository>;
  
  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    profilRepository = mock<ProfilRepository>();
    utilisateurAuthentifieJWTService = new UtilisateurAuthentifieJWTService({ utilisateurRepository, profilRepository });
  });

  it("quand l'utilisateur est toujours présent dans la base utilisateur, doit retourner l'utilisateur authentifie associe au token jwt", async () => {
    // Given
    const email = 'test@example.com';
    const tokenAPIInformation = new TokenAPIInformationBuilder().withEmail('test@example.com').build();
    const tokenJWT = await new TokenAPIJWTService({ secret: process.env.TOKEN_API_SECRET! }).creerTokenAPI(tokenAPIInformation);
    const habilitationsAPI = new HabilitationAuthentitificationAPIBuilder().ajouterHabilitationLecture('chantiers', ['7a33ee55-b74c-4464-892b-b2b7fdc3bc58']).build();
    const utilisateur = new UtilisateurBuilder().withEmail(email).withProfil('CABINET_MTFP').withHabilitations(habilitationsAPI).build();

    // @ts-expect-error Attention ici on n'utilise pas le bon utilisateur car il y trop d'action effectué pour retourner les habilitations, il faudrait simplifier tout cela.
    utilisateurRepository.récupérer.mockResolvedValue(utilisateur);
    profilRepository.estAutoriseAAccederAuxChantiersBrouillons.mockResolvedValue(true);

    // When
    const utilisateurAuthentifie = await utilisateurAuthentifieJWTService.recupererUtilisateurAuthentifie(tokenJWT);
    profilRepository.estAutoriseAAccederAuxChantiersBrouillons.mockResolvedValue(true);

    // Then
    expect(profilRepository.estAutoriseAAccederAuxChantiersBrouillons).toHaveBeenNthCalledWith(1, { profilCode: 'CABINET_MTFP' });
    expect(utilisateurAuthentifie.habilitations).toEqual({
      gestionUtilisateur: {
        chantiers: ['7a33ee55-b74c-4464-892b-b2b7fdc3bc58'],
        territoires: [],
        périmètres: [],
      },
      saisieCommentaire: {
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      saisieIndicateur: {
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      lecture: {
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      'projetsStructurants.lecture': {
        projetsStructurants: [],
      },
    });
    expect(utilisateurAuthentifie.email).toEqual('test@example.com');
    expect(utilisateurAuthentifie.profil).toEqual('CABINET_MTFP');
    expect(utilisateurAuthentifie.profilAAccèsAuxChantiersBrouillons).toEqual(true);
  });

  it("quand l'utilisateur n'est plus présent dans la base utilisateur, doit retourner une erreur", async () => {
    // Given
    const tokenAPIInformation = new TokenAPIInformationBuilder().withEmail('test@example.com').build();
    const tokenJWT = await new TokenAPIJWTService({ secret: process.env.TOKEN_API_SECRET! }).creerTokenAPI(tokenAPIInformation);
    utilisateurRepository.récupérer.mockResolvedValue(null);
    expect.assertions(1);

    try {
      // When
      await utilisateurAuthentifieJWTService.recupererUtilisateurAuthentifie(tokenJWT);
    } catch (error: unknown) {
      // Then
      expect((error as Error).message).toEqual("L'utilisateur n'existe pas ou plus dans la base de données utilisateur de pilote");
    }
  });
});
