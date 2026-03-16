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
  ChantierPourExport,
  masquerPourProfilDROM,
  masquerPourProfilDROMEtMailleNat,
  verifierOptionChantiersSignales,
  verifierOptionEstBarometreEtEstTerritorialise,
  verifierOptionMeteo,
  verifierOptionPerimetreIds,
  verifierOptionStatut,
} from "@/server/chantiers/domain/ChantierPourExport";

const presenterEnChantierExportContrat = (
  chantierPourExport: ChantierPourExport,
  profil: ProfilCode,
  optionsExport: OptionsExport,
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
      chantierPourExport.directeursProjet?.join(" ") || NON_RENSEIGNEE,
      chantierPourExport.directeursProjetMails?.join(" ") || NON_RENSEIGNEE,
      chantierPourExport.responsablesLocaux?.join(" ") || NON_RENSEIGNEE,
      chantierPourExport.responsablesLocauxMails?.join(" ") || NON_RENSEIGNEE,
      chantierPourExport.coordinateursTerritoriaux?.join(" ") || NON_RENSEIGNEE,
      chantierPourExport.coordinateursTerritoriauxMails?.join(" ") ||
        NON_RENSEIGNEE,
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
        libellésTypesObjectif["déjàFait"],
        libellésTypesObjectif["àFaire"],
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

  constructor({ chantierRepository }: Inject<"chantierRepository">) {
    this.chantierRepository = chantierRepository;
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
    for (let i = 0; i < chantierIds.length; i += chantierChunkSize) {
      const partialChantierIds = chantierIds.slice(i, i + chantierChunkSize);

      const input = partialChantierIds.map((id) =>
        this.chantierRepository
          .recupererPourExports(
            id,
            territoireCodes,
            optionsExport,
            jalonSelectionne,
            jalonParDefaut,
          )
          .then((listerChantierTerritoireExport) =>
            (listerChantierTerritoireExport || []).reduce(
              (acc, chantierTerritoireExport) => {
                if (
                  chantierTerritoireExport &&
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
                  verifierOptionMeteo(
                    optionsExport,
                    chantierTerritoireExport.météo,
                  ) &&
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
                    ),
                  ];
                }
                return acc;
              },
              [] as string[][],
            ),
          ),
      );

      yield await Promise.all(input).then((result) => result.flat());
    }
  }
}
