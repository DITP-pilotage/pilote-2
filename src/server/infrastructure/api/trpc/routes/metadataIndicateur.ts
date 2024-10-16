import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import {
  validationFiltresPourListeMetadataIndicateur,
  validationMetadataIndicateurContexte,
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
import RécupérerMetadataIndicateurIdentifiantGénéréUseCase
  from '@/server/parametrage-indicateur/usecases/RécupérerMetadataIndicateurIdentifiantGénéréUseCase';
import CreerUneMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/CreerUneMetadataIndicateurUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  MetadataParametrageIndicateurForm,
} from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateurInputForm';
import { getContainer } from '@/server/dependances';

const convertirEnMetadataParametrageIndicateurForm = (input: any): MetadataParametrageIndicateurForm =>  {
  return {
    indicId: input.indicId,
    indicParentIndic: input.indicParentIndic || null,
    indicParentCh: input.indicParentCh,
    indicNom: input.indicNom || '',
    indicNomBaro: input.indicIsBaro ? input.indicNomBaro || null : null,
    indicDescr: input.indicDescr || '',
    indicDescrBaro: input.indicIsBaro ? input.indicDescrBaro || null : null,
    indicIsPerseverant: input.indicIsPerseverant,
    indicIsPhare: input.indicIsPhare,
    indicIsBaro: input.indicIsBaro,
    indicType: input.indicType || '',
    indicSource: input.indicSource || '',
    indicSourceUrl: input.indicSourceUrl || null,
    indicMethodeCalcul: input.indicMethodeCalcul || '',
    indicUnite: input.indicUnite || null,
    indicHiddenPilote: input.indicHiddenPilote !== 'true',
    indicSchema: input.indicSchema || '',
    zgApplicable: input.zgApplicable || null,
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
    poidsPourcentDept: (!Number.isNaN(input.poidsPourcentDept) && +input.poidsPourcentDept) || 0,
    poidsPourcentReg: (!Number.isNaN(input.poidsPourcentReg) && +input.poidsPourcentReg) || 0,
    poidsPourcentNat: (!Number.isNaN(input.poidsPourcentNat) && +input.poidsPourcentNat) || 0,
    tendance: input.tendance,
    reformePrioritaire: input.reformePrioritaire || null,
    projetAnnuelPerf: input.projetAnnuelPerf,
    detailProjetAnnuelPerf: input.detailProjetAnnuelPerf || null,
    periodicite: input.periodicite,
    delaiDisponibilite: (!Number.isNaN(input.delaiDisponibilite) && +input.delaiDisponibilite) || 0,
    indicTerritorialise: input.indicTerritorialise,
    frequenceTerritoriale: (!Number.isNaN(input.frequenceTerritoriale) && +input.frequenceTerritoriale) || 0,
    mailles: input.mailles || null,
    adminSource: input.adminSource,
    methodeCollecte: input.methodeCollecte || null,
    siSource: input.siSource || null,
    donneeOuverte: input.donneeOuverte,
    modalitesDonneeOuverte: input.modalitesDonneeOuverte || null,
    respDonnees: input.respDonnees || null,
    respDonneesEmail: input.respDonneesEmail || null,
    contactTechnique: input.contactTechnique || null,
    contactTechniqueEmail: input.contactTechniqueEmail || '',
    commentaire: input.commentaire || null,
  };
};

export const metadataIndicateurRouter = créerRouteurTRPC({
  récupérerMetadataIndicateurFiltrés: procédureProtégée
    .input(validationFiltresPourListeMetadataIndicateur)
    .query(async ({ input }): Promise<MetadataParametrageIndicateurContrat[]> => {
      const listeMetadataIndicateur = await new RécupérerListeMetadataIndicateurUseCase(getContainer('parametrageIndicateur').resolve('metadataParametrageIndicateurRepository')).run(input.filtres.chantiers, input.filtres.perimetresMinisteriels, input.filtres.estTerritorialise, input.filtres.estBarometre);
      return listeMetadataIndicateur.map(presenterEnMetadataParametrageIndicateurContrat);
    }),
  récupérerMetadataIndicateurIdentifiantGénéré: procédureProtégée
    .query(async ({}): Promise<string> => {
      return new RécupérerMetadataIndicateurIdentifiantGénéréUseCase(getContainer('parametrageIndicateur').resolve('metadataParametrageIndicateurRepository')).run();
    }),
  modifier: procédureProtégée.input(zodValidateurCSRF.merge(validationMetadataIndicateurFormulaire).and(validationMetadataIndicateurContexte))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return new ModifierUneMetadataIndicateurUseCase(getContainer('parametrageIndicateur').resolve('metadataParametrageIndicateurRepository'), dependencies.getHistorisationModificationRepository()).run(ctx.session.user.email as string, convertirEnMetadataParametrageIndicateurForm(input));
    }),
  creer: procédureProtégée.input(zodValidateurCSRF.merge(validationMetadataIndicateurFormulaire).and(validationMetadataIndicateurContexte))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return new CreerUneMetadataIndicateurUseCase(getContainer('parametrageIndicateur').resolve('metadataParametrageIndicateurRepository'), dependencies.getHistorisationModificationRepository()).run(ctx.session.user.email as string, convertirEnMetadataParametrageIndicateurForm(input));
    }),
});
