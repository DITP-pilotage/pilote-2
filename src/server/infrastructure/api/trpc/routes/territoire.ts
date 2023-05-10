import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';

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
});
