import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import {
  createValidationMetadataIndicateurFormulaire,
  validationFiltresPourListeMetadataIndicateur,
  ValidationMetadataIndicateurFormulaire,
} from "@/validation/metadata-indicateur";
import {
  MetadataParametrageIndicateurContrat,
  MetadataParametrageIndicateurInformationContrat,
  presenterEnMetadataParametrageIndicateurContrat,
  presenterEnMetadataParametrageIndicateurInformationContrat,
} from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { presenterEnMapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { zodValidateurCSRF } from "@/validation/publication";
import { MetadataParametrageIndicateurForm } from "@/server/parametrage-indicateur/domain/MetadataParametrageIndicateurInputForm";
import { getContainer } from "@/server/dependances";
import { defaultHistoriqueInformation } from "@/server/parametrage-indicateur/domain/DefaultHistoriqueInformation";
import { enregistrerMetadataIndicateurCommandSchema } from "@/server/parametrage-indicateur/handlers/EnregistrerMetadataIndicateurHandler";

const validationMetadataIndicateurInput = z.object({
  indicId: z.string(),
  indicParentIndic: z.string().nullable(),
  indicParentCh: z.string(),
  indicNom: z.string(),
  indicNomBaro: z.string().nullable(),
  indicDescr: z.string(),
  indicDescrBaro: z.string().nullable(),
  indicIsPerseverant: z.boolean(),
  indicIsPhare: z.boolean(),
  indicIsBaro: z.boolean(),
  indicType: z.string(),
  indicSource: z.string().nullable(),
  indicSourceUrl: z.string().nullable(),
  indicMethodeCalcul: z.string().nullable(),
  indicUnite: z.string().nullable(),
  indicHiddenPilote: z.string(),
  indicSchema: z.string().nullable(),
  zgApplicable: z.string().nullable(),
  viDeptFrom: z.string(),
  viDeptOp: z.string().optional(),
  vaDeptFrom: z.string(),
  vaDeptOp: z.string().optional(),
  vcDeptFrom: z.string(),
  vcDeptOp: z.string().optional(),
  viRegFrom: z.string(),
  viRegOp: z.string().optional(),
  vaRegFrom: z.string(),
  vaRegOp: z.string().optional(),
  vcRegFrom: z.string(),
  vcRegOp: z.string().optional(),
  viNatFrom: z.string(),
  viNatOp: z.string().optional(),
  vaNatFrom: z.string(),
  vaNatOp: z.string().optional(),
  vcNatFrom: z.string(),
  vcNatOp: z.string().optional(),
  paramVacaDecumulFrom: z.string(),
  paramVacaPartitionDate: z.string(),
  paramVacaOp: z.string(),
  paramVacgDecumulFrom: z.string(),
  paramVacgPartitionDate: z.string(),
  paramVacgOp: z.string(),
  poidsPourcentDept: z.string(),
  poidsPourcentReg: z.string(),
  poidsPourcentNat: z.string(),
  poidsPourcentEvalNat: z.string(),
  poidsPourcentEvalReg: z.string(),
  poidsPourcentEvalDept: z.string(),
  tendance: z.string(),
  reformePrioritaire: z.string().nullable(),
  projetAnnuelPerf: z.boolean(),
  detailProjetAnnuelPerf: z.string().nullable(),
  periodicite: z.string(),
  delaiDisponibilite: z.string(),
  indicTerritorialise: z.boolean(),
  frequenceTerritoriale: z.string(),
  mailles: z.string().nullable(),
  adminSource: z.string(),
  methodeCollecte: z.string().nullable(),
  siSource: z.string().nullable(),
  donneeOuverte: z.boolean(),
  modalitesDonneeOuverte: z.string().nullable(),
  respDonnees: z.string().nullable(),
  respDonneesEmail: z.string().nullable(),
  contactTechnique: z.string().nullable(),
  contactTechniqueEmail: z.string().nullable(),
  commentaire: z.string().nullable(),
  maillePilotage: z.string(),
  cibleAttendue: z.boolean(),
  couvertureTemporelle: z.string(),
});

const convertirEnMetadataParametrageIndicateurForm = (
  input: z.infer<ValidationMetadataIndicateurFormulaire>,
): MetadataParametrageIndicateurForm => {
  return {
    indicId: input.indicId,
    indicParentIndic: input.indicParentIndic || null,
    indicParentCh: input.indicParentCh,
    indicNom: input.indicNom || "",
    indicNomBaro: input.indicIsBaro ? input.indicNomBaro || null : null,
    indicDescr: input.indicDescr || "",
    indicDescrBaro: input.indicIsBaro ? input.indicDescrBaro || null : null,
    indicIsPerseverant: input.indicIsPerseverant,
    indicIsPhare: input.indicIsPhare,
    indicIsBaro: input.indicIsBaro,
    indicType: input.indicType || "",
    indicSource: input.indicSource || "",
    indicSourceUrl: input.indicSourceUrl || null,
    indicMethodeCalcul: input.indicMethodeCalcul || "",
    indicUnite: input.indicUnite || null,
    indicHiddenPilote: input.indicHiddenPilote !== "true",
    indicSchema: input.indicSchema || "",
    zgApplicable: input.zgApplicable || null,
    viDeptFrom: input.viDeptFrom,
    viDeptOp: input.viDeptOp ?? "",
    vaDeptFrom: input.vaDeptFrom,
    vaDeptOp: input.vaDeptOp ?? "",
    vcDeptFrom: input.vcDeptFrom,
    vcDeptOp: input.vcDeptOp ?? "",
    viRegFrom: input.viRegFrom,
    viRegOp: input.viRegOp ?? "",
    vaRegFrom: input.vaRegFrom,
    vaRegOp: input.vaRegOp ?? "",
    vcRegFrom: input.vcRegFrom,
    vcRegOp: input.vcRegOp ?? "",
    viNatFrom: input.viNatFrom,
    viNatOp: input.viNatOp ?? "",
    vaNatFrom: input.vaNatFrom,
    vaNatOp: input.vaNatOp ?? "",
    vcNatFrom: input.vcNatFrom,
    vcNatOp: input.vcNatOp ?? "",
    paramVacaDecumulFrom: input.paramVacaDecumulFrom,
    paramVacaPartitionDate: input.paramVacaPartitionDate,
    paramVacaOp: input.paramVacaOp,
    paramVacgDecumulFrom: input.paramVacgDecumulFrom,
    paramVacgPartitionDate: input.paramVacgPartitionDate,
    paramVacgOp: input.paramVacgOp,
    poidsPourcentDept:
      (!Number.isNaN(input.poidsPourcentDept) && +input.poidsPourcentDept) || 0,
    poidsPourcentReg:
      (!Number.isNaN(input.poidsPourcentReg) && +input.poidsPourcentReg) || 0,
    poidsPourcentNat:
      (!Number.isNaN(input.poidsPourcentNat) && +input.poidsPourcentNat) || 0,
    poidsPourcentEvalNat:
      (!Number.isNaN(input.poidsPourcentEvalNat) &&
        +input.poidsPourcentEvalNat) ||
      0,
    poidsPourcentEvalReg:
      (!Number.isNaN(input.poidsPourcentEvalReg) &&
        +input.poidsPourcentEvalReg) ||
      0,
    poidsPourcentEvalDept:
      (!Number.isNaN(input.poidsPourcentEvalDept) &&
        +input.poidsPourcentEvalDept) ||
      0,
    tendance: input.tendance,
    reformePrioritaire: input.reformePrioritaire || null,
    projetAnnuelPerf: input.projetAnnuelPerf,
    detailProjetAnnuelPerf: input.detailProjetAnnuelPerf || null,
    periodicite: input.periodicite,
    delaiDisponibilite:
      (!Number.isNaN(input.delaiDisponibilite) && +input.delaiDisponibilite) ||
      0,
    indicTerritorialise: input.indicTerritorialise,
    frequenceTerritoriale:
      (!Number.isNaN(input.frequenceTerritoriale) &&
        +input.frequenceTerritoriale) ||
      0,
    mailles: input.mailles || null,
    adminSource: input.adminSource,
    methodeCollecte: input.methodeCollecte || null,
    siSource: input.siSource || null,
    donneeOuverte: input.donneeOuverte,
    modalitesDonneeOuverte: input.modalitesDonneeOuverte || null,
    respDonnees: input.respDonnees || null,
    respDonneesEmail: input.respDonneesEmail || null,
    contactTechnique: input.contactTechnique || null,
    contactTechniqueEmail: input.contactTechniqueEmail || "",
    commentaire: input.commentaire || null,
    maillePilotage: input.maillePilotage || "",
    cibleAttendue: input.cibleAttendue,
    couvertureTemporelle: input.couvertureTemporelle || "",
  };
};

export const metadataIndicateurRouter = créerRouteurTRPC({
  récupérerMetadataIndicateurFiltrés: procédureProtégée
    .input(validationFiltresPourListeMetadataIndicateur)
    .query(
      async ({
        input,
        ctx,
      }): Promise<MetadataParametrageIndicateurContrat[]> => {
        const habilitations = await getContainer("gestionUtilisateur")
          .resolve("habilitationService")
          .recupererHabilitations(ctx.session);

        habilitations.verifierAutorisationLectureMetadataIndicateur();

        const listeMetadataIndicateur = await getContainer(
          "parametrageIndicateur",
        )
          .resolve("récupérerListeMetadataIndicateurUseCase")
          .run(
            input.filtres.chantiers,
            input.filtres.perimetresMinisteriels,
            input.filtres.estTerritorialise,
            input.filtres.estBarometre,
          );
        return listeMetadataIndicateur.map(
          presenterEnMetadataParametrageIndicateurContrat,
        );
      },
    ),
  listerMetadataIndicateurFiltrés: procédureProtégée
    .input(validationFiltresPourListeMetadataIndicateur)
    .query(
      async ({
        input,
        ctx,
      }): Promise<MetadataParametrageIndicateurInformationContrat[]> => {
        const habilitations = await getContainer("gestionUtilisateur")
          .resolve("habilitationService")
          .recupererHabilitations(ctx.session);

        habilitations.verifierAutorisationLectureMetadataIndicateur();

        const listeMetadataIndicateur = await getContainer(
          "parametrageIndicateur",
        )
          .resolve("récupérerListeMetadataIndicateurUseCase")
          .run(
            input.filtres.chantiers,
            input.filtres.perimetresMinisteriels,
            input.filtres.estTerritorialise,
            input.filtres.estBarometre,
          );
        const mapHistorisationIndicateur = await getContainer(
          "parametrageIndicateur",
        )
          .resolve("metadataParametrageIndicateurQuery")
          .listerInformationDerniereModification({
            listeIndicId: listeMetadataIndicateur.map(
              (metadataIndicateur) => metadataIndicateur.indicId,
            ),
          });
        return listeMetadataIndicateur.map((indicateur) =>
          presenterEnMetadataParametrageIndicateurInformationContrat(
            indicateur,
            mapHistorisationIndicateur.get(indicateur.indicId) ||
              defaultHistoriqueInformation,
          ),
        );
      },
    ),
  récupérerMetadataIndicateurIdentifiantGénéré: procédureProtégée.query(
    async ({ ctx }): Promise<string> => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);
      habilitations.verifierAutorisationLectureMetadataIndicateur();

      return getContainer("parametrageIndicateur")
        .resolve("récupérerMetadataIndicateurIdentifiantGénéréUseCase")
        .run();
    },
  ),
  modifier: procédureProtégée
    .input(validationMetadataIndicateurInput.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);
      habilitations.verifierAutorisationModificationMetadataIndicateur();

      const informationMetadata = await getContainer("parametrageIndicateur")
        .resolve("récupérerInformationMetadataIndicateurUseCase")
        .run();
      const metadata =
        presenterEnMapInformationMetadataIndicateurContrat(informationMetadata);
      const validationSchema =
        createValidationMetadataIndicateurFormulaire(metadata);
      const validatedInput = validationSchema.parse(input);

      return getContainer("parametrageIndicateur")
        .resolve("modifierUneMetadataIndicateurUseCase")
        .run(
          ctx.session.user.id as string,
          convertirEnMetadataParametrageIndicateurForm(validatedInput),
        );
    }),
  creer: procédureProtégée
    .input(validationMetadataIndicateurInput.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);
      habilitations.verifierAutorisationModificationMetadataIndicateur();

      const informationMetadata = await getContainer("parametrageIndicateur")
        .resolve("récupérerInformationMetadataIndicateurUseCase")
        .run();
      const metadata =
        presenterEnMapInformationMetadataIndicateurContrat(informationMetadata);
      const validationSchema =
        createValidationMetadataIndicateurFormulaire(metadata);
      const validatedInput = validationSchema.parse(input);

      return getContainer("parametrageIndicateur")
        .resolve("creerUneMetadataIndicateurUseCase")
        .run(
          ctx.session.user.id as string,
          convertirEnMetadataParametrageIndicateurForm(validatedInput),
        );
    }),
  enregistrerMetadataIndicateur: procédureProtégée
    .input(enregistrerMetadataIndicateurCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);
      habilitations.verifierAutorisationModificationMetadataIndicateur();

      await getContainer("parametrageIndicateur")
        .resolve("enregistrerMetadataIndicateurHandler")
        .execute(input);
    }),
});
