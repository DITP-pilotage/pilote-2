import {
  créerRouteurTRPC,
  procédureProtégée,
} from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { validationChantierDonnéesTerritorialesRépartitionGéographique } from '@/validation/chantierDonnéesTerritoriales';
import RécupérerChantierRépartitionGéographiqueUseCase
  from '@/server/usecase/chantierDonnéesTerritoriales/RécupérerChantierRépartitionGéographiqueUseCase';

export const chantierDonnéesTerritorialesRouter = créerRouteurTRPC({
  récupérerRépartitionGéographique: procédureProtégée
    .input(validationChantierDonnéesTerritorialesRépartitionGéographique)
    .query(({ input }) => {
      const récupérerRépartitionGéographiqueUseCase = new RécupérerChantierRépartitionGéographiqueUseCase(dependencies.getChantierDonnéesTerritorialesRepository());
      return récupérerRépartitionGéographiqueUseCase.run(input.chantierId);
    }),
});
