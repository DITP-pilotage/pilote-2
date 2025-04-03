import { AwilixContainer, asClass } from 'awilix';

import { PrismaPilote } from '@/server/db/PrismaPilote';
import { FicheTerritorialeHandler } from './infrastructure/handlers/FicheTerritorialeHandler';
import { RécupérerTerritoireParCodeUseCase } from './usecases/RécupérerTerritoireParCodeUseCase';
import { RécupérerListeChantierFicheTerritorialeUseCase } from './usecases/RécupérerListeChantierFicheTerritorialeUseCase';
import { RécupérerTauxAvancementAnnuelTerritoireUseCase } from './usecases/RécupérerTauxAvancementAnnuelTerritoireUseCase';
import { RécupérerRépartitionMétéoUseCase } from './usecases/RécupérerRépartitionMétéoUseCase';
import { RécupérerTauxAvancementGlobalTerritoireUseCase } from './usecases/RécupérerTauxAvancementGlobalTerritoireUseCase';
import { PrismaChantierRepository } from './infrastructure/adapters/PrismaChantierRepository';
import { PrismaTerritoireRepository } from './infrastructure/adapters/PrismaTerritoireRepository';
import { TerritoireRepository } from './domain/ports/TerritoireRepository';
import { ChantierRepository } from './domain/ports/ChantierRepository';
import { PrismaMinistereRepository } from './infrastructure/adapters/PrismaMinistereRepository';
import { PrismaIndicateurRepository } from './infrastructure/adapters/PrismaIndicateurRepository';
import { IndicateurRepository } from './domain/ports/IndicateurRepository';
import { MinistereRepository } from './domain/ports/MinistereRepository';
import { PrismaSyntheseDesResultatsRepository } from './infrastructure/adapters/PrismaSyntheseDesResultatsRepository';
import { SyntheseDesResultatsRepository } from './domain/ports/SyntheseDesResultatsRepository';

export type FicheTerritorialeDependencies = {
  ficheTerritorialeHandler: FicheTerritorialeHandler
  recupererTerritoireParCodeUseCase: RécupérerTerritoireParCodeUseCase
  recupererTauxAvancementGlobalTerritoireUseCase: RécupérerTauxAvancementGlobalTerritoireUseCase
  recupererTauxAvancementAnnuelTerritoireUseCase: RécupérerTauxAvancementAnnuelTerritoireUseCase
  recupererRépartitionMétéoUseCase: RécupérerRépartitionMétéoUseCase
  recupererListeChantierFicheTerritorialeUseCase: RécupérerListeChantierFicheTerritorialeUseCase
  chantierRepository: ChantierRepository
  territoireRepository: TerritoireRepository
  indicateurRepository: IndicateurRepository
  ministereRepository: MinistereRepository
  syntheseDesResultatsRepository: SyntheseDesResultatsRepository
};

export const getFicheTerritorialeContainer = (initialContainer: AwilixContainer<{ prisma: PrismaPilote }>): AwilixContainer<FicheTerritorialeDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<FicheTerritorialeDependencies>().register({
    ficheTerritorialeHandler: asClass(FicheTerritorialeHandler),
    recupererTerritoireParCodeUseCase: asClass(RécupérerTerritoireParCodeUseCase),
    recupererTauxAvancementGlobalTerritoireUseCase: asClass(RécupérerTauxAvancementGlobalTerritoireUseCase),
    recupererTauxAvancementAnnuelTerritoireUseCase: asClass(RécupérerTauxAvancementAnnuelTerritoireUseCase),
    recupererRépartitionMétéoUseCase: asClass(RécupérerRépartitionMétéoUseCase),
    recupererListeChantierFicheTerritorialeUseCase: asClass(RécupérerListeChantierFicheTerritorialeUseCase),
    chantierRepository: asClass(PrismaChantierRepository),
    territoireRepository: asClass(PrismaTerritoireRepository),
    syntheseDesResultatsRepository: asClass(PrismaSyntheseDesResultatsRepository),
    indicateurRepository: asClass(PrismaIndicateurRepository),
    ministereRepository: asClass(PrismaMinistereRepository),
  });
};
