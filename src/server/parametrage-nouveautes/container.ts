import { asClass, AwilixContainer } from 'awilix';
import { PrismaPilote } from '@/server/db/PrismaPilote';
import { CreerNouveauteUseCase } from './usecases/CreerNouveauteUseCase';
import { PrismaNouveauteRepository } from './infrastructure/adapters/PrismaNouveauteRepository';
import { NouveauteRepository } from './domain/ports/NouveauteRepository';
import { ListerNouveautesUseCase } from './usecases/ListerNouveautesUseCase';
import { ModifierNouveauteUseCase } from './usecases/ModifierNouveauteUseCase';

export type ParametrageNouveautesDependencies = {
  creerNouveauteUseCase: CreerNouveauteUseCase;
  nouveauteRepository: NouveauteRepository;
  listerNouveautesUseCase: ListerNouveautesUseCase;
  modifierNouveauteUseCase: ModifierNouveauteUseCase;
};

export const getParametrageNouveautesContainer = (initialContainer: AwilixContainer<{ prisma: PrismaPilote }>): AwilixContainer<ParametrageNouveautesDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<ParametrageNouveautesDependencies>().register({
    creerNouveauteUseCase: asClass(CreerNouveauteUseCase),
    nouveauteRepository: asClass(PrismaNouveauteRepository),
    listerNouveautesUseCase: asClass(ListerNouveautesUseCase),
    modifierNouveauteUseCase: asClass(ModifierNouveauteUseCase),
  });
};
