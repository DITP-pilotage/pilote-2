import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import {
  validationFiltresPourListeMetadataIndicateur,
  validationMetadataIndicateurFormulaire,
} from '@/validation/metadataIndicateur';
import {
  MetadataParametrageIndicateurContrat, MetadataParametrageIndicateurInformationContrat,
  presenterEnMetadataParametrageIndicateurContrat, presenterEnMetadataParametrageIndicateurInformationContrat,
} from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { zodValidateurCSRF } from '@/validation/publication';
import {
  MetadataParametrageIndicateurForm,
} from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateurInputForm';
import { getContainer } from '@/server/dependances';
import { defaultHistoriqueInformation } from '@/server/parametrage-indicateur/domain/DefaultHistoriqueInformation';
import Habilitation from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';

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
    maillePilotage: input.maillePilotage || null,
    cibleAttendue: input.cibleAttendue || null,
    couvertureTemporelle: input.couvertureTemporelle || null,
  };
};

export const metadataIndicateurRouter = créerRouteurTRPC({
  récupérerMetadataIndicateurFiltrés: procédureProtégée
    .input(validationFiltresPourListeMetadataIndicateur)
    .query(async ({ input, ctx }): Promise<MetadataParametrageIndicateurContrat[]> => {
      const habilitations = new Habilitation(ctx.session.habilitations);

      habilitations.verifierAutorisationLectureMetadataIndicateur(ctx.session.profil);

      const listeMetadataIndicateur = await getContainer('parametrageIndicateur').resolve('récupérerListeMetadataIndicateurUseCase').run(input.filtres.chantiers, input.filtres.perimetresMinisteriels, input.filtres.estTerritorialise, input.filtres.estBarometre);
      return listeMetadataIndicateur.map(presenterEnMetadataParametrageIndicateurContrat);
    }),
  listerMetadataIndicateurFiltrés: procédureProtégée
    .input(validationFiltresPourListeMetadataIndicateur)
    .query(async ({ input, ctx }): Promise<MetadataParametrageIndicateurInformationContrat[]> => {
      const habilitations = new Habilitation(ctx.session.habilitations);

      habilitations.verifierAutorisationLectureMetadataIndicateur(ctx.session.profil);

      const listeMetadataIndicateur = await getContainer('parametrageIndicateur').resolve('récupérerListeMetadataIndicateurUseCase').run(input.filtres.chantiers, input.filtres.perimetresMinisteriels, input.filtres.estTerritorialise, input.filtres.estBarometre);
      const mapHistorisationIndicateur = await getContainer('parametrageIndicateur').resolve('metadataParametrageIndicateurQuery').listerInformationDerniereModification({ listeIndicId: listeMetadataIndicateur.map(metadataIndicateur => metadataIndicateur.indicId) });
      return listeMetadataIndicateur.map(indicateur => presenterEnMetadataParametrageIndicateurInformationContrat(indicateur, mapHistorisationIndicateur.get(indicateur.indicId) || defaultHistoriqueInformation));
    }),
  récupérerMetadataIndicateurIdentifiantGénéré: procédureProtégée
    .query(async ({ ctx }): Promise<string> => {
      const habilitations = new Habilitation(ctx.session.habilitations);
      habilitations.verifierAutorisationLectureMetadataIndicateur(ctx.session.profil);

      return getContainer('parametrageIndicateur').resolve('récupérerMetadataIndicateurIdentifiantGénéréUseCase').run();
    }),
  modifier: procédureProtégée.input(validationMetadataIndicateurFormulaire.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      const habilitations = new Habilitation(ctx.session.habilitations);
      habilitations.verifierAutorisationModificationMetadataIndicateur(ctx.session.profil);

      return getContainer('parametrageIndicateur').resolve('modifierUneMetadataIndicateurUseCase').run(ctx.session.user.id as string, convertirEnMetadataParametrageIndicateurForm(input));
    }),
  creer: procédureProtégée.input(validationMetadataIndicateurFormulaire.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      const habilitations = new Habilitation(ctx.session.habilitations);
      habilitations.verifierAutorisationModificationMetadataIndicateur(ctx.session.profil);

      return getContainer('parametrageIndicateur').resolve('creerUneMetadataIndicateurUseCase').run(ctx.session.user.id as string, convertirEnMetadataParametrageIndicateurForm(input));
    }),
});
