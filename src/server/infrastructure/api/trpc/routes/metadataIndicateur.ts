import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import {
  validationFiltresPourListeMetadataIndicateur, validationMetadataIndicateurContexte,
  validationMetadataIndicateurFormulaire,
} from '@/validation/metadataIndicateur';
import RécupérerListeMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/RécupérerListeMetadataIndicateurUseCase';
import {
  MetadataParametrageIndicateurContrat,
  presenterEnMetadataParametrageIndicateurContrat,
} from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { zodValidateurCSRF } from '@/validation/publication';
import ModifierUneMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/ModifierUneMetadataIndicateurUseCase';

export const metadataIndicateurRouter = créerRouteurTRPC({
  récupérerMetadataIndicateurFiltrés: procédureProtégée
    .input(validationFiltresPourListeMetadataIndicateur)
    .query(async ({ input }): Promise<MetadataParametrageIndicateurContrat[]> => {
      const listeMetadataIndicateur = await new RécupérerListeMetadataIndicateurUseCase().run(input.filtres.chantiers);
      return listeMetadataIndicateur.map(presenterEnMetadataParametrageIndicateurContrat);
    }),
  modifier: procédureProtégée.input(zodValidateurCSRF.merge(validationMetadataIndicateurFormulaire).and(validationMetadataIndicateurContexte))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      return new ModifierUneMetadataIndicateurUseCase().run({
        indicId: input.indicId,
        indicParentIndic: input.indicParentIndic || '',
        indicNom: input.indicNom || '',
        indicNomBaro: input.indicNomBaro || '',
        indicDescr: input.indicDescr || '',
        indicDescrBaro: input.indicDescrBaro || '',
        indicIsPerseverant: input.indicIsPerseverant === 'true',
        indicIsPhare: input.indicIsPhare === 'true',
        indicIsBaro: input.indicIsBaro === 'true',
        indicType: input.indicType || '',
        indicSource: input.indicSource || '',
        indicSourceUrl: input.indicSourceUrl || '',
        indicMethodeCalcul: input.indicMethodeCalcul || '',
        indicUnite: input.indicUnite || '',
        indicHiddenPilote: input.indicHiddenPilote === 'true',
        indicSchema: input.indicSchema || '',
        viDeptFrom: input.viDeptFrom,
        viDeptOp: input.viDeptOp,
        vaDeptFrom: input.vaDeptFrom,
        vaDeptOp: input.vaDeptOp,
        vcDeptFrom: input.vcDeptFrom,
        vcDeptOp: input.vcDeptOp,
        viRegFrom: input.viRegFrom,
        viRegOp: input.viRegOp,
        vaRegFrom: input.vaRegFrom,
        vaRegOp: input.vaRegOp,
        vcRegFrom: input.vcRegFrom,
        vcRegOp: input.vcRegOp,
        viNatFrom: input.viNatFrom,
        viNatOp: input.viNatOp,
        vaNatFrom: input.vaNatFrom,
        vaNatOp: input.vaNatOp,
        vcNatFrom: input.vcNatFrom,
        vcNatOp: input.vcNatOp,
        paramVacaDecumulFrom: input.paramVacaDecumulFrom,
        paramVacaPartitionDate: input.paramVacaPartitionDate,
        paramVacaOp: input.paramVacaOp,
        paramVacgDecumulFrom: input.paramVacgDecumulFrom,
        paramVacgPartitionDate: input.paramVacgPartitionDate,
        paramVacgOp: input.paramVacgOp,
        poidsPourcentDept: input.poidsPourcentDept,
        poidsPourcentReg: input.poidsPourcentReg,
        poidsPourcentNat: input.poidsPourcentNat,
        tendance: input.tendance,

      });
    }),
});
