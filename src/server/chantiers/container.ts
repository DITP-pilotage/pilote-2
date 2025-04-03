import { asClass, AwilixContainer } from 'awilix';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { RecupererDonneesChantierQuery } from '@/server/chantiers/infrastructure/queries/RecupererDonneesChantierQuery';
import { PrismaChantierRepository } from '@/server/chantiers/infrastructure/adapters/PrismaChantierRepository';
import { PrismaIndicateurRepository } from '@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { ExportCsvDesChantiersUseCase } from '@/server/chantiers/usecases/ExportCsvDesChantiersUseCase';
import ExportCsvDesIndicateursUseCase from '@/server/chantiers/usecases/ExportCsvDesIndicateursUseCase';
import { ExportCsvDesIndicateursUseCaseV2 } from '@/server/chantiers/usecases/ExportCsvDesIndicateursUseCaseV2';
import {
  ExportCsvDesHistoriquesIndicateursUseCase,
} from '@/server/chantiers/usecases/ExportCsvDesHistoriquesIndicateursUseCase';
import { PrismaPilote } from '@/server/db/PrismaPilote';
import {
  PropositionValeurActuelleRepository,
} from '@/server/chantiers/domain/ports/PropositionValeurActuelleRepository';
import {
  PrismaPropositionValeurActuelleRepository,
} from '@/server/chantiers/infrastructure/adapters/PrismaPropositionValeurActuelleRepository';
import {
  CreerPropositionValeurActuelleUseCase,
} from '@/server/chantiers/usecases/CreerPropositionValeurActuelleUseCase';
import {
  ModifierPropositionValeurActuelleUseCase,
} from '@/server/chantiers/usecases/ModifierPropositionValeurActuelleUseCase';
import { MinistereRepository } from '@/server/chantiers/domain/ports/MinistereRepository';
import { ExportCsvDesChantiersUseCaseV2 } from './usecases/ExportCsvDesChantiersUseCaseV2';
import { TerritoireRepository } from './domain/ports/TerritoireRepository';
import { PrismaTerritoireRepository } from './infrastructure/adapters/PrismaTerritoireRepository';
import { PrismaMinistereRepository } from './infrastructure/adapters/PrismaMinistereRepository';
import { CréerUneSynthèseDesRésultatsUseCase } from './usecases/page-chantier/CréerUneSynthèseDesRésultatsUseCase';
import { RécupérerHistoriqueSynthèseDesRésultatsUseCase } from './usecases/page-chantier/RécupérerHistoriqueSynthèseDesRésultatsUseCase';
import { RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase } from './usecases/page-accueil/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase';
import { SyntheseDesResultatsRepository } from './domain/ports/SyntheseDesResultatsRepository';
import { PrismaSyntheseDesResultatsRepository } from './infrastructure/adapters/PrismaSyntheseDesResultatsRepository';
import { RécupérerChantierUseCase } from './usecases/page-accueil/RécupérerChantierUseCase';
import { RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase } from './usecases/page-accueil/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase';
import { ListerDétailsIndicateurTerritoireUseCase } from './usecases/page-accueil/ListerDétailsIndicateurTerritoireUseCase';
import { AxeRepository } from './domain/ports/AxeRepository';
import { PrismaAxeRepository } from './infrastructure/adapters/PrismaAxeRepository';
import { RecupererRepartitionsMeteoChantiersUseCase } from './usecases/RecupererRepartitionMeteoChantiersUseCase';
import { RécupérerChantiersAccessiblesEnLectureUseCase } from './usecases/RécupérerChantiersAccessiblesEnLectureUseCase';
import { RécupérerChantiersAccessiblesEnLectureUseCase as RécupérerChantiersAccessiblesEnLectureUseCaseRapportDetaille } from './usecases/RécupérerChantiersAccessiblesEnLectureUseCaseRapportDetaille';

export type ChantierDependencies = {
  chantierRepository: ChantierRepository
  indicateurRepository: IndicateurRepository
  territoireRepository: TerritoireRepository
  propositionValeurActuelleRepository: PropositionValeurActuelleRepository
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery
  exportCsvDesChantiersUseCase: ExportCsvDesChantiersUseCase
  exportCsvDesChantiersUseCaseV2: ExportCsvDesChantiersUseCaseV2
  exportCsvDesIndicateursUseCase: ExportCsvDesIndicateursUseCase
  exportCsvDesIndicateursUseCaseV2: ExportCsvDesIndicateursUseCaseV2
  exportCsvDesHistoriquesIndicateursUseCase: ExportCsvDesHistoriquesIndicateursUseCase
  creerPropositionValeurActuelleUseCase: CreerPropositionValeurActuelleUseCase
  modifierPropositionValeurActuelleUseCase: ModifierPropositionValeurActuelleUseCase
  créerUneSynthèseDesRésultatsUseCase: CréerUneSynthèseDesRésultatsUseCase
  récupérerHistoriqueSynthèseDesRésultatsUseCase: RécupérerHistoriqueSynthèseDesRésultatsUseCase
  récupérerSynthèseDesRésultatsLaPlusRécenteUseCase: RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase
  synthèseDesRésultatsRepository: SyntheseDesResultatsRepository
  récupérerChantierUseCase: RécupérerChantierUseCase
  récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase
  listerDétailsIndicateurTerritoireUseCase: ListerDétailsIndicateurTerritoireUseCase
  axeRepository: AxeRepository
  ministereRepository: MinistereRepository
  recupererRepartitionsMeteoChantiersUseCase: RecupererRepartitionsMeteoChantiersUseCase
  recupererChantiersAccessiblesEnLectureUseCase: RécupérerChantiersAccessiblesEnLectureUseCase
  // TODO Fusionner les 2 UseCase
  recupererChantiersAccessiblesEnLectureUseCaseRapportDetaille: RécupérerChantiersAccessiblesEnLectureUseCaseRapportDetaille
};

export const getChantiersContainer = (initialContainer: AwilixContainer<{ prisma: PrismaPilote }>): AwilixContainer<ChantierDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<ChantierDependencies>().register({
    chantierRepository: asClass(PrismaChantierRepository),
    indicateurRepository: asClass(PrismaIndicateurRepository),
    territoireRepository: asClass(PrismaTerritoireRepository),
    propositionValeurActuelleRepository: asClass(PrismaPropositionValeurActuelleRepository),
    recupererDonneesChantierQuery: asClass(RecupererDonneesChantierQuery),
    exportCsvDesChantiersUseCase: asClass(ExportCsvDesChantiersUseCase),
    exportCsvDesChantiersUseCaseV2: asClass(ExportCsvDesChantiersUseCaseV2),
    exportCsvDesIndicateursUseCase: asClass(ExportCsvDesIndicateursUseCase),
    exportCsvDesIndicateursUseCaseV2: asClass(ExportCsvDesIndicateursUseCaseV2),
    exportCsvDesHistoriquesIndicateursUseCase: asClass(ExportCsvDesHistoriquesIndicateursUseCase),
    creerPropositionValeurActuelleUseCase: asClass(CreerPropositionValeurActuelleUseCase),
    modifierPropositionValeurActuelleUseCase: asClass(ModifierPropositionValeurActuelleUseCase),
    créerUneSynthèseDesRésultatsUseCase: asClass(CréerUneSynthèseDesRésultatsUseCase),
    récupérerHistoriqueSynthèseDesRésultatsUseCase: asClass(RécupérerHistoriqueSynthèseDesRésultatsUseCase),
    récupérerSynthèseDesRésultatsLaPlusRécenteUseCase: asClass(RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase),
    synthèseDesRésultatsRepository: asClass(PrismaSyntheseDesResultatsRepository),
    récupérerChantierUseCase: asClass(RécupérerChantierUseCase),
    récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase: asClass(RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase),
    listerDétailsIndicateurTerritoireUseCase: asClass(ListerDétailsIndicateurTerritoireUseCase),
    recupererRepartitionsMeteoChantiersUseCase: asClass(RecupererRepartitionsMeteoChantiersUseCase),
    axeRepository: asClass(PrismaAxeRepository),
    ministereRepository: asClass(PrismaMinistereRepository),
    recupererChantiersAccessiblesEnLectureUseCase: asClass(RécupérerChantiersAccessiblesEnLectureUseCase),
    // TODO Fusionner les 2 UseCase
    recupererChantiersAccessiblesEnLectureUseCaseRapportDetaille: asClass(RécupérerChantiersAccessiblesEnLectureUseCaseRapportDetaille),
  });
};
