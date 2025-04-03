import { asClass, AwilixContainer } from 'awilix';
import { ChantierRepository } from '@/server/gestion-utilisateur/domain/ports/ChantierRepository';
import {
  PrismaChantierRepository,
} from '@/server/gestion-utilisateur/infrastructure/adapters/PrismaChantierRepository';
import {
  RecupererChantiersSynthetisesUseCase,
} from '@/server/gestion-utilisateur/usecases/RecupererChantiersSynthetisesUseCase';
import {
  PrismaPerimetreMinisterielRepository,
} from '@/server/gestion-utilisateur/infrastructure/adapters/PrismaPerimetreMinisteriel';
import {
  PerimetreMinisterielRepository,
} from '@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository';
import { RecupererPerimetresMinisterielsUseCase } from '@/server/gestion-utilisateur/usecases/RecupererPerimetresMinisterielsUseCase';
import { RecupererListeProfilUseCase } from '@/server/gestion-utilisateur/usecases/RecupererListeProfilUseCase';
import { ProfilRepository } from '@/server/gestion-utilisateur/domain/ports/ProfilRepository';
import { PrismaProfilRepository } from '@/server/gestion-utilisateur/infrastructure/adapters/PrismaProfilRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';
import {
  PrismaTerritoireRepository,
} from '@/server/gestion-utilisateur/infrastructure/adapters/PrismaTerritoireRepository';
import { TerritoireRepository } from '@/server/gestion-utilisateur/domain/ports/TerritoireRepository';
import {
  RecupererTerritoiresAvecNombreUtilisateursUseCase,
} from '@/server/gestion-utilisateur/usecases/RecupererTerritoiresAvecNombreUtilisateursUseCase';
import { FiltrerListeUtilisateursUseCase } from '@/server/gestion-utilisateur/usecases/FiltrerListeUtilisateursUseCase';
import { RecupererTousLesTerritoiresUseCase } from '@/server/usecase/territoire/RecupererTousLesTerritoiresUseCase';
import {
  RecupererListeUtilisateursUseCase,
} from '@/server/gestion-utilisateur/usecases/RecupererListeUtilisateursUseCase';
import { PrismaHistorisationModificationRepository } from '@/server/infrastructure/accès_données/historisationModification/PrismaHistorisationModificationRepository';
import { HistorisationModificationRepository } from '@/server/domain/historisationModification/HistorisationModificationRepository';
import { UtilisateurRepository } from './domain/ports/UtilisateurRepository';
import { UtilisateurIAMRepository } from './domain/ports/UtilisateurIAMRepository';
import { TokenAPIInformationRepository } from './domain/ports/TokenAPIInformationRepository';
import { DesactiverUnUtilisateurUseCase } from './usecases/DesactiverUnUtilisateurUseCase';
import { PrismaUtilisateurRepository } from './infrastructure/adapters/PrismaUtilisateurRepository';
import { UtilisateurIAMKeycloakRepository } from './infrastructure/adapters/UtilisateurIAMKeycloakRepository';
import { PrismaTokenAPIInformationRepository } from './infrastructure/adapters/PrismaTokenAPIInformationRepository';
import { ReactiverUnUtilisateurUseCase } from './usecases/ReactiverUnUtilisateurUseCase';
import { RecupererListeUtilisateursExistantsUseCase } from './usecases/RecupererListeUtilisateursExistantsUseCase';
import { RécupérerUnUtilisateurUseCase } from './usecases/RécupérerUnUtilisateurUseCase';
import { SupprimerUnUtilisateurUseCase } from './usecases/SupprimerUnUtilisateurUseCase';
import { CréerOuMettreÀJourUnUtilisateurUseCase } from './usecases/CréerOuMettreÀJourUnUtilisateurUseCase';
import { RécupérerUnProfilUseCase } from './usecases/RécupérerUnProfilUseCase';
import { RecupererEtatVisualisationVideoAccueilUseCase } from './usecases/RecupererEtatVisualisationVideoAccueilUseCase';
import { DesactiverVideoAccueilUseCase } from './usecases/DesactiverVideoAccueilUseCase';

export type GestionUtilisateurDependencies = {
  utilisateurRepository: UtilisateurRepository
  territoireRepository: TerritoireRepository
  utilisateurIAMRepository: UtilisateurIAMRepository
  chantierRepository: ChantierRepository
  perimetreMinisterielRepository: PerimetreMinisterielRepository,
  profilRepository: ProfilRepository,
  tokenAPIInformationRepository: TokenAPIInformationRepository
  desactiverUnUtilisateurUseCase: DesactiverUnUtilisateurUseCase
  reactiverUnUtilisateurUseCase: ReactiverUnUtilisateurUseCase
  recupererChantiersSynthetisesUseCase: RecupererChantiersSynthetisesUseCase
  recupererPerimetresMinisterielsUseCase: RecupererPerimetresMinisterielsUseCase
  recupererListeProfilUseCase: RecupererListeProfilUseCase
  recupererTerritoiresAvecNombreUtilisateursUseCase: RecupererTerritoiresAvecNombreUtilisateursUseCase
  filtrerListeUtilisateursUseCase: FiltrerListeUtilisateursUseCase
  recupererTousLesTerritoiresUseCase: RecupererTousLesTerritoiresUseCase
  recupererListeUtilisateursUseCase: RecupererListeUtilisateursUseCase
  recupererListeUtilisateursExistantsUseCase: RecupererListeUtilisateursExistantsUseCase
  récupérerUnUtilisateurUseCase: RécupérerUnUtilisateurUseCase
  supprimerUnUtilisateurUseCase: SupprimerUnUtilisateurUseCase
  créerOuMettreÀJourUnUtilisateurUseCase: CréerOuMettreÀJourUnUtilisateurUseCase
  historisationModificationRepository: HistorisationModificationRepository
  utilisateurIAMKeycloakRepository: UtilisateurIAMKeycloakRepository
  récupérerUnProfilUseCase: RécupérerUnProfilUseCase
  recupererEtatVisualisationVideoAccueilUseCase: RecupererEtatVisualisationVideoAccueilUseCase
  desactiverVideoAccueilUseCase: DesactiverVideoAccueilUseCase
};

export const getGestionUtilisateurContainer = (initialContainer: AwilixContainer<{ prisma: PrismaPilote }>): AwilixContainer<GestionUtilisateurDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<GestionUtilisateurDependencies>().register({
    utilisateurRepository: asClass(PrismaUtilisateurRepository),
    territoireRepository: asClass(PrismaTerritoireRepository),
    utilisateurIAMRepository: asClass(UtilisateurIAMKeycloakRepository),
    chantierRepository: asClass(PrismaChantierRepository),
    perimetreMinisterielRepository: asClass(PrismaPerimetreMinisterielRepository),
    profilRepository: asClass(PrismaProfilRepository),
    tokenAPIInformationRepository: asClass(PrismaTokenAPIInformationRepository),
    desactiverUnUtilisateurUseCase: asClass(DesactiverUnUtilisateurUseCase),
    reactiverUnUtilisateurUseCase: asClass(ReactiverUnUtilisateurUseCase),
    recupererChantiersSynthetisesUseCase: asClass(RecupererChantiersSynthetisesUseCase),
    recupererPerimetresMinisterielsUseCase: asClass(RecupererPerimetresMinisterielsUseCase),
    recupererListeProfilUseCase: asClass(RecupererListeProfilUseCase),
    recupererTerritoiresAvecNombreUtilisateursUseCase: asClass(RecupererTerritoiresAvecNombreUtilisateursUseCase),
    filtrerListeUtilisateursUseCase: asClass(FiltrerListeUtilisateursUseCase),
    recupererTousLesTerritoiresUseCase: asClass(RecupererTousLesTerritoiresUseCase),
    recupererListeUtilisateursUseCase: asClass(RecupererListeUtilisateursUseCase),
    recupererListeUtilisateursExistantsUseCase: asClass(RecupererListeUtilisateursExistantsUseCase),
    récupérerUnUtilisateurUseCase: asClass(RécupérerUnUtilisateurUseCase),
    supprimerUnUtilisateurUseCase: asClass(SupprimerUnUtilisateurUseCase),
    créerOuMettreÀJourUnUtilisateurUseCase: asClass(CréerOuMettreÀJourUnUtilisateurUseCase),
    historisationModificationRepository: asClass(PrismaHistorisationModificationRepository),
    utilisateurIAMKeycloakRepository: asClass(UtilisateurIAMKeycloakRepository),
    récupérerUnProfilUseCase: asClass(RécupérerUnProfilUseCase),
    recupererEtatVisualisationVideoAccueilUseCase: asClass(RecupererEtatVisualisationVideoAccueilUseCase),
    desactiverVideoAccueilUseCase: asClass(DesactiverVideoAccueilUseCase),
  });
};
