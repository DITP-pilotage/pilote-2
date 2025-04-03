import { z } from 'zod';
import { DétailTerritoire, TerritoireAvecNombreUtilisateurs } from '@/server/domain/territoire/Territoire.interface';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';
import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { getContainer } from '@/server/dependances';
const validation = z.object({
  territoireCodes: z.array(z.string()).nullable(),
});

export const territoireRouter = créerRouteurTRPC({
  récupérerTous: procédureProtégée
    .query(async ({ ctx }): Promise<DétailTerritoire[]> => {
      const territoires = await dependencies.getTerritoireRepository().récupérerTous();
      const habilitation = new Habilitation(ctx.session.habilitations);
      return territoires.map(territoire => ({ 
        ...territoire, 
        accèsLecture: habilitation.peutAccéderAuTerritoire(territoire.code), 
        accèsSaisiePublication: habilitation.peutSaisirDesPublicationsPourUnTerritoire(territoire.code), 
        accèsSaisieIndicateur: habilitation.peutSaisirDesIndicateursPourUnTerritoire(territoire.code), 
      }));
    }),
  récupérerListe: procédureProtégée
    .input(validation)
    .query(async ({ input }): Promise<TerritoireAvecNombreUtilisateurs[]> => {
      return getContainer('gestionUtilisateur').resolve('recupererTerritoiresAvecNombreUtilisateursUseCase').run({ territoireCodes: input.territoireCodes });
    }),
});
