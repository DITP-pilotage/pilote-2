import {
  formaterMétéoOuNonRenseigne,
  formaterNumériqueOuValeurManquante,
  NON,
  NON_APPLICABLE,
  NON_RENSEIGNEE,
  OUI,
} from "@/server/infrastructure/export_csv/valeurs";
import { libellesTypesCommentaire } from "@/client/constants/libellesCommentaire";
import { libellésTypesObjectif } from "@/client/constants/libellésObjectif";
import { libellésTypesDécisionStratégique } from "@/client/constants/libellésDécisionStratégique";
import {
  ProfilCode,
  profilsTerritoriaux,
} from "@/server/domain/utilisateur/Utilisateur.interface";
import { OptionsExport } from "@/server/usecase/chantier/OptionsExport";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import type { Inject } from "@/server/chantiers/module";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import {
  UtilisateurEnrichi,
  UtilisateurRepository,
} from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { GetStatistiquesAvancementChantiersParChantierQuery } from "@/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersParChantierQuery";
import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import {
  ChantierPourExport,
  masquerPourProfilDROM,
  masquerPourProfilDROMEtMailleNat,
  verifierOptionChantiersSignales,
  verifierOptionEstBarometreEtEstTerritorialise,
  verifierOptionMeteo,
  verifierOptionPerimetreIds,
  verifierOptionStatut,
} from "@/server/chantiers/domain/ChantierPourExport";
import {
  resolveMails,
  resolveNoms,
} from "@/server/chantiers/app/contrats/resolveResponsables";

const presenterEnChantierExportContrat = (
  chantierPourExport: ChantierPourExport,
  profil: ProfilCode,
  optionsExport: OptionsExport,
  statistiquesReg: AvancementsStatistiques,
  statistiquesDept: AvancementsStatistiques,
  utilisateurParId: Map<string, UtilisateurEnrichi>,
): string[] => {
  const donnees = [
    chantierPourExport.maille === "NAT"
      ? "1 - NAT"
      : chantierPourExport.maille === "REG"
        ? "2 - REG"
        : chantierPourExport.maille === "DEPT"
          ? "3 - DEPT"
          : NON_APPLICABLE,
    chantierPourExport.régionNom || NON_APPLICABLE,
    chantierPourExport.départementNom || NON_APPLICABLE,
    chantierPourExport.départementNom && chantierPourExport.codeInsee
      ? `${chantierPourExport.codeInsee === "2A" ? "20A" : chantierPourExport.codeInsee === "2B" ? "20B" : chantierPourExport.codeInsee?.padStart(2, "0")} - ${chantierPourExport.départementNom}`
      : NON_APPLICABLE,
    chantierPourExport.id || NON_RENSEIGNEE,
    chantierPourExport.nom || NON_RENSEIGNEE,
  ];

  if (optionsExport.listeOptionsExport.includes("gouvernance")) {
    donnees.push(
      ...(profil === ProfilEnum.DITP_ADMIN
        ? [
            chantierPourExport.ministèreNom || NON_RENSEIGNEE,
            chantierPourExport.axe || NON_RENSEIGNEE,
            chantierPourExport.statut || NON_RENSEIGNEE,
            chantierPourExport.estTerritorialisé ? OUI : NON,
            chantierPourExport.estBaromètre ? OUI : NON,
          ]
        : [
            chantierPourExport.ministèreNom || NON_RENSEIGNEE,
            chantierPourExport.axe || NON_RENSEIGNEE,
            chantierPourExport.estTerritorialisé ? OUI : NON,
            chantierPourExport.estBaromètre ? OUI : NON,
          ]),
    );
  }
  if (optionsExport.listeOptionsExport.includes("responsabilite")) {
    donnees.push(
      resolveNoms(
        chantierPourExport.directeursProjetIds,
        utilisateurParId,
      ).join(" ") || NON_RENSEIGNEE,
      resolveMails(
        chantierPourExport.directeursProjetIds,
        utilisateurParId,
      ).join(" ") || NON_RENSEIGNEE,
      resolveNoms(
        chantierPourExport.responsablesLocauxIds,
        utilisateurParId,
      ).join(" ") || NON_RENSEIGNEE,
      resolveMails(
        chantierPourExport.responsablesLocauxIds,
        utilisateurParId,
      ).join(" ") || NON_RENSEIGNEE,
      resolveNoms(
        chantierPourExport.coordinateursTerritoriauxIds,
        utilisateurParId,
      ).join(" ") || NON_RENSEIGNEE,
      resolveMails(
        chantierPourExport.coordinateursTerritoriauxIds,
        utilisateurParId,
      ).join(" ") || NON_RENSEIGNEE,
    );
  }

  if (optionsExport.listeOptionsExport.includes("objectif")) {
    donnees.push(
      chantierPourExport.objNotreAmbition || NON_RENSEIGNEE,
      chantierPourExport.objDéjàFait || NON_RENSEIGNEE,
      chantierPourExport.objÀFaire || NON_RENSEIGNEE,
    );
  }

  if (optionsExport.listeOptionsExport.includes("description")) {
    donnees.push(
      formaterNumériqueOuValeurManquante(
        chantierPourExport.tauxDAvancement,
        true,
      ),
    );
  }

  if (optionsExport.listeOptionsExport.includes("comparaison")) {
    donnees.push(
      formaterNumériqueOuValeurManquante(
        chantierPourExport.tauxDAvancementDépartemental,
        true,
      ),
      formaterNumériqueOuValeurManquante(
        chantierPourExport.tauxDAvancementRégional,
        true,
      ),
      masquerPourProfilDROM(profil, chantierPourExport.périmètreIds)
        ? NON_APPLICABLE
        : formaterNumériqueOuValeurManquante(
            chantierPourExport.tauxDAvancementNational,
            true,
          ),
    );
  }

  if (optionsExport.listeOptionsExport.includes("valeurs-reference")) {
    donnees.push(
      formaterNumériqueOuValeurManquante(
        statistiquesReg?.maximum ?? null,
        true,
      ),
      formaterNumériqueOuValeurManquante(
        statistiquesReg?.médiane ?? null,
        true,
      ),
      formaterNumériqueOuValeurManquante(
        statistiquesReg?.minimum ?? null,
        true,
      ),
      formaterNumériqueOuValeurManquante(
        statistiquesDept?.maximum ?? null,
        true,
      ),
      formaterNumériqueOuValeurManquante(
        statistiquesDept?.médiane ?? null,
        true,
      ),
      formaterNumériqueOuValeurManquante(
        statistiquesDept?.minimum ?? null,
        true,
      ),
    );
  }

  if (optionsExport.listeOptionsExport.includes("synthese")) {
    donnees.push(
      formaterMétéoOuNonRenseigne(chantierPourExport.météo, true),
      chantierPourExport.synthèseDesRésultats || NON_RENSEIGNEE,
    );
  }

  if (optionsExport.listeOptionsExport.includes("commentaire")) {
    donnees.push(
      chantierPourExport.commCommentairesSurLesDonnées || NON_RENSEIGNEE,
      chantierPourExport.commAutresRésultats || NON_RENSEIGNEE,
    );
    if (!profilsTerritoriaux.includes(profil)) {
      donnees.push(
        chantierPourExport.commAutresRésultatsNonCorrélésAuxIndicateurs ||
          NON_RENSEIGNEE,
        chantierPourExport.commFreinsÀLever || NON_RENSEIGNEE,
        chantierPourExport.commActionsÀVenir || NON_RENSEIGNEE,
        chantierPourExport.commActionsÀValoriser || NON_RENSEIGNEE,
      );
    }
  }

  if (
    optionsExport.listeOptionsExport.includes("decision") &&
    !profilsTerritoriaux.includes(profil)
  ) {
    donnees.push(
      chantierPourExport.decStratSuiviDesDécisions || NON_RENSEIGNEE,
    );
  }

  return donnees;
};

export class ExportCsvDesChantiersUseCase {
  public static readonly NOMS_COLONNES = (
    jalon: number,
    optionsExport: OptionsExport,
    profil: ProfilEnum,
  ): string[] => {
    const headersColumn = [
      "Maille",
      "Région",
      "Département",
      "Code INSEE - Nom du département",
      "Chantier Id",
      "Chantier",
    ];

    if (optionsExport.listeOptionsExport.includes("gouvernance")) {
      headersColumn.push(
        ...(profil === ProfilEnum.DITP_ADMIN
          ? [
              "Ministère",
              "Axe",
              "Statut",
              "Chantier territorialisé",
              "Chantier du baromètre",
            ]
          : [
              "Ministère",
              "Axe",
              "Chantier territorialisé",
              "Chantier du baromètre",
            ]),
      );
    }

    if (optionsExport.listeOptionsExport.includes("responsabilite")) {
      headersColumn.push(
        "Directeur projet",
        "Contact directeur projet",
        "Responsable local",
        "Contact responsable local",
        "Coordinateur territorial",
        "Contact coordinateur territorial",
      );
    }

    if (optionsExport.listeOptionsExport.includes("objectif")) {
      headersColumn.push(
        libellésTypesObjectif["notreAmbition"],
        libellésTypesObjectif["dejaFait"],
        libellésTypesObjectif["aFaire"],
      );
    }

    if (optionsExport.listeOptionsExport.includes("description")) {
      headersColumn.push(`Taux d'avancement à fin d'échéance ${jalon}`);
    }

    if (optionsExport.listeOptionsExport.includes("comparaison")) {
      headersColumn.push(
        `Taux d'avancement départemental à fin d'échéance ${jalon}`,
        `Taux d'avancement régional à fin d'échéance ${jalon}`,
        `Taux d'avancement national à fin d'échéance ${jalon}`,
      );
    }

    if (optionsExport.listeOptionsExport.includes("valeurs-reference")) {
      headersColumn.push(
        `maximum régional ${jalon}`,
        `médiane régionale ${jalon}`,
        `minimum régional ${jalon}`,
        `maximum départemental ${jalon}`,
        `médiane départementale ${jalon}`,
        `minimum départemental ${jalon}`,
      );
    }

    if (optionsExport.listeOptionsExport.includes("synthese")) {
      headersColumn.push("Météo", "Synthèse des résultats");
    }

    if (optionsExport.listeOptionsExport.includes("commentaire")) {
      headersColumn.push(
        libellesTypesCommentaire["commentairesSurLesDonnées"],
        libellesTypesCommentaire["autresRésultatsObtenus"],
      );

      if (!profilsTerritoriaux.includes(profil)) {
        headersColumn.push(
          libellesTypesCommentaire[
            "autresRésultatsObtenusNonCorrélésAuxIndicateurs"
          ],
          libellesTypesCommentaire["risquesEtFreinsÀLever"],
          libellesTypesCommentaire["solutionsEtActionsÀVenir"],
          libellesTypesCommentaire["exemplesConcretsDeRéussite"],
        );
      }
    }

    if (
      optionsExport.listeOptionsExport.includes("decision") &&
      !profilsTerritoriaux.includes(profil)
    ) {
      headersColumn.push(
        libellésTypesDécisionStratégique["suiviDesDecisionsStrategiques"],
      );
    }

    return headersColumn;
  };

  private readonly chantierRepository: ChantierRepository;
  private readonly utilisateurRepository: UtilisateurRepository;
  private readonly getStatistiquesAvancementChantiersParChantierQuery: GetStatistiquesAvancementChantiersParChantierQuery;

  constructor({
    chantierRepository,
    utilisateurRepository,
    getStatistiquesAvancementChantiersParChantierQuery,
  }: Inject<
    | "chantierRepository"
    | "utilisateurRepository"
    | "getStatistiquesAvancementChantiersParChantierQuery"
  >) {
    this.chantierRepository = chantierRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.getStatistiquesAvancementChantiersParChantierQuery =
      getStatistiquesAvancementChantiersParChantierQuery;
  }

  public async *run({
    chantierIds,
    territoireCodes,
    profil,
    chantierChunkSize,
    optionsExport,
    jalonSelectionne,
    jalonParDefaut,
  }: {
    chantierIds: string[];
    territoireCodes: string[];
    profil: ProfilCode;
    chantierChunkSize: number;
    optionsExport: OptionsExport;
    jalonSelectionne: number;
    jalonParDefaut: number;
  }): AsyncGenerator<string[][]> {
    const [statistiquesRegParChantier, statistiquesDeptParChantier] =
      await Promise.all([
        this.getStatistiquesAvancementChantiersParChantierQuery.execute({
          listeChantier: chantierIds,
          maille: "regionale",
          jalon: jalonSelectionne,
        }),
        this.getStatistiquesAvancementChantiersParChantierQuery.execute({
          listeChantier: chantierIds,
          maille: "departementale",
          jalon: jalonSelectionne,
        }),
      ]);
    for (let i = 0; i < chantierIds.length; i += chantierChunkSize) {
      const partialChantierIds = chantierIds.slice(i, i + chantierChunkSize);

      const chantiersExport = await Promise.all(
        partialChantierIds.map((id) =>
          this.chantierRepository.recupererPourExports(
            id,
            territoireCodes,
            optionsExport,
            jalonSelectionne,
            jalonParDefaut,
          ),
        ),
      ).then((results) => results.flatMap((result) => result ?? []));

      const allIds = [
        ...new Set(
          chantiersExport.flatMap((c) => [
            ...c.directeursProjetIds,
            ...c.responsablesLocauxIds,
            ...c.coordinateursTerritoriauxIds,
          ]),
        ),
      ];
      const utilisateurParId =
        await this.utilisateurRepository.recupererParIds(allIds);

      const rows = chantiersExport.reduce((acc, chantierTerritoireExport) => {
        if (
          !masquerPourProfilDROMEtMailleNat(
            profil,
            chantierTerritoireExport.périmètreIds,
            chantierTerritoireExport.maille,
          ) &&
          verifierOptionPerimetreIds(
            optionsExport,
            chantierTerritoireExport.périmètreIds,
          ) &&
          verifierOptionEstBarometreEtEstTerritorialise(
            optionsExport,
            chantierTerritoireExport.estBaromètre,
          ) &&
          verifierOptionStatut(
            optionsExport,
            chantierTerritoireExport.statut,
          ) &&
          verifierOptionMeteo(optionsExport, chantierTerritoireExport.météo) &&
          verifierOptionChantiersSignales(
            optionsExport,
            chantierTerritoireExport.ecart,
            chantierTerritoireExport.tendance,
            chantierTerritoireExport.tauxDAvancementJalonParDefaut,
            chantierTerritoireExport.cibleAttendu,
            chantierTerritoireExport.aUnTauxAvancementDepartemental,
            chantierTerritoireExport.météo ?? "NON_RENSEIGNEE",
            chantierTerritoireExport.aUnePropositionsValeurAvancement,
          )
        ) {
          return [
            ...acc,
            presenterEnChantierExportContrat(
              chantierTerritoireExport,
              profil,
              optionsExport,
              statistiquesRegParChantier.get(chantierTerritoireExport.id) ??
                null,
              statistiquesDeptParChantier.get(chantierTerritoireExport.id) ??
                null,
              utilisateurParId,
            ),
          ];
        }
        return acc;
      }, [] as string[][]);

      yield rows;
    }
  }
}
