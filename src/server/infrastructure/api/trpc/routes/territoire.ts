import { z } from 'zod';
import { DétailTerritoire, Territoire, TerritoireAvecNombreUtilisateurs } from '@/server/domain/territoire/Territoire.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

const validation = z.object({
  territoireCodes: z.array(z.string()),
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
      const territoires = await dependencies.getTerritoireRepository().récupérerListe(input.territoireCodes);
      
      const territoiresAvecUtilisateurs = await Promise.all(territoires.map(async territoire => {
        const nombreUtilisateur = await dependencies.getUtilisateurRepository().récupérerNombreDeCompteSurLeTerritoire(territoire.code, territoire.maille as MailleInterne);
        return {
          ...territoire,
          nombreUtilisateur: nombreUtilisateur.length,
        };
      }));

      return territoiresAvecUtilisateurs;
    }),
});
