import {
  formaterDateHeureOuNonRenseignee,
  formaterMétéoOuNonRenseigne,
  formaterNumériqueOuValeurManquante,
  formaterNumériqueOuValeurNonRenseignee,
  NON,
  NON_APPLICABLE,
  NON_RENSEIGNEE,
  OUI,
} from "@/server/infrastructure/export_csv/valeurs";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { OptionsExport } from "@/server/usecase/chantier/OptionsExport";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import {
  IndicateurPourExport,
  verifierApplicabiliteMaille,
} from "@/server/chantiers/domain/IndicateurPourExport";
import {
  masquerPourProfilDROMEtMailleNat,
  verifierOptionChantiersSignales,
  verifierOptionEstBarometreEtEstTerritorialise,
  verifierOptionMeteo,
  verifierOptionPerimetreIds,
  verifierOptionStatut,
} from "@/server/chantiers/domain/ChantierPourExport";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";

const presenterEnIndicateurExportContrat = (
  indicateurPourExport: IndicateurPourExport,
  profil: string,
  optionsExport: OptionsExport,
): string[] => {
  const donnees = [
    indicateurPourExport.maille === "NAT"
      ? "1 - NAT"
      : indicateurPourExport.maille === "REG"
        ? "2 - REG"
        : indicateurPourExport.maille === "DEPT"
          ? "3 - DEPT"
          : NON_RENSEIGNEE,
    indicateurPourExport.régionNom || NON_APPLICABLE,
    indicateurPourExport.départementNom || NON_APPLICABLE,
    indicateurPourExport.départementNom && indicateurPourExport.codeInsee
      ? `${indicateurPourExport.codeInsee === "2A" ? "20A" : indicateurPourExport.codeInsee === "2B" ? "20B" : indicateurPourExport.codeInsee?.padStart(2, "0")} - ${indicateurPourExport.départementNom}`
      : NON_APPLICABLE,
    indicateurPourExport.chantierNom || NON_RENSEIGNEE,
    indicateurPourExport.chantierId || NON_RENSEIGNEE,
    indicateurPourExport.nom || NON_APPLICABLE,
  ];

  if (optionsExport.listeOptionsExport.includes("cadrage")) {
    donnees.push(
      indicateurPourExport.description || NON_RENSEIGNEE,
      indicateurPourExport.methodeCalcul || NON_RENSEIGNEE,
      indicateurPourExport.source || NON_RENSEIGNEE,
      indicateurPourExport.periodesMiseAJour || NON_RENSEIGNEE,
      Number.isNaN(indicateurPourExport.delaiDisponibilite)
        ? NON_RENSEIGNEE
        : `${indicateurPourExport.delaiDisponibilite} mois`,
    );
  }

  if (optionsExport.listeOptionsExport.includes("gouvernance")) {
    donnees.push(
      ...(profil === ProfilEnum.DITP_ADMIN
        ? [
            indicateurPourExport.chantierMinistèreNom || NON_RENSEIGNEE,
            indicateurPourExport.axe || NON_RENSEIGNEE,
            indicateurPourExport.chantierStatut || NON_APPLICABLE,
            indicateurPourExport.chantierEstBaromètre ? OUI : NON,
          ]
        : [
            indicateurPourExport.chantierMinistèreNom || NON_RENSEIGNEE,
            indicateurPourExport.axe || NON_RENSEIGNEE,
            indicateurPourExport.chantierEstBaromètre ? OUI : NON,
          ]),
    );
  }

  if (optionsExport.listeOptionsExport.includes("responsabilite")) {
    // Aucune donnée pour le moment
  }

  if (optionsExport.listeOptionsExport.includes("objectif")) {
    // Aucune donnée pour le moment
  }

  if (optionsExport.listeOptionsExport.includes("description")) {
    donnees.push(
      formaterNumériqueOuValeurNonRenseignee(
        indicateurPourExport.valeurInitiale,
        indicateurPourExport.estApplicable,
      ),
      formaterDateHeureOuNonRenseignee(
        indicateurPourExport.dateValeurInitiale,
        indicateurPourExport.estApplicable,
        "MM-YYYY",
      ),
      formaterNumériqueOuValeurNonRenseignee(
        indicateurPourExport.valeurAvancement,
        indicateurPourExport.estApplicable,
      ),
      formaterDateHeureOuNonRenseignee(
        indicateurPourExport.dateValeurAvancement,
        indicateurPourExport.estApplicable,
        "MM-YYYY",
      ),
      formaterNumériqueOuValeurNonRenseignee(
        indicateurPourExport.valeurCibleAnnuelle,
        indicateurPourExport.estApplicable,
      ),
      formaterDateHeureOuNonRenseignee(
        indicateurPourExport.dateValeurCibleAnnuelle,
        indicateurPourExport.estApplicable,
        "MM-YYYY",
      ),
      formaterNumériqueOuValeurNonRenseignee(
        indicateurPourExport.valeurCible,
        indicateurPourExport.estApplicable,
      ),
      formaterDateHeureOuNonRenseignee(
        indicateurPourExport.dateValeurCible,
        indicateurPourExport.estApplicable,
        "MM-YYYY",
      ),
      formaterNumériqueOuValeurManquante(
        indicateurPourExport.avancementAnnuel,
        indicateurPourExport.estApplicable,
      ),
      formaterNumériqueOuValeurManquante(
        indicateurPourExport.avancementGlobal,
        indicateurPourExport.estApplicable,
      ),
    );
  }

  if (optionsExport.listeOptionsExport.includes("description-chantier")) {
    donnees.push(
      formaterNumériqueOuValeurManquante(
        indicateurPourExport.chantierAvancementGlobal,
        indicateurPourExport.chantierEstApplicable,
      ),
      formaterNumériqueOuValeurManquante(
        indicateurPourExport.chantierAvancementAnnuel,
        indicateurPourExport.chantierEstApplicable,
      ),
    );
  }

  if (optionsExport.listeOptionsExport.includes("comparaison")) {
    // Aucune donnée pour le moment
  }

  if (optionsExport.listeOptionsExport.includes("synthese")) {
    donnees.push(
      formaterMétéoOuNonRenseigne(
        indicateurPourExport.météo,
        indicateurPourExport.chantierEstApplicable,
      ),
    );
  }

  if (optionsExport.listeOptionsExport.includes("commentaire")) {
    // Aucune donnée pour le moment
  }

  if (optionsExport.listeOptionsExport.includes("decision")) {
    // Aucune donnée pour le moment
  }

  return donnees;
};

interface Dependencies {
  indicateurRepository: IndicateurRepository;
}

export class ExportCsvDesIndicateursUseCaseV2 {
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
      "Chantier",
      "Chantier Id",
      "Indicateur",
    ];

    if (optionsExport.listeOptionsExport.includes("cadrage")) {
      headersColumn.push(
        "Description",
        "Méthode de calcul",
        "Source",
        "Périodes de mise à jour",
        "Délai de disponibilité",
      );
    }

    if (optionsExport.listeOptionsExport.includes("gouvernance")) {
      headersColumn.push(
        ...(profil === ProfilEnum.DITP_ADMIN
          ? ["Ministère", "Axe", "Chantier statut", "Chantier du baromètre"]
          : ["Ministère", "Axe", "Chantier du baromètre"]),
      );
    }

    if (optionsExport.listeOptionsExport.includes("responsabilite")) {
      // Aucune donnée pour le moment
    }

    if (optionsExport.listeOptionsExport.includes("objectif")) {
      // Aucune donnée pour le moment
    }

    if (optionsExport.listeOptionsExport.includes("description")) {
      headersColumn.push(
        "Valeur initiale",
        "Date valeur initiale",
        "Valeur avancement",
        "Date valeur avancement",
        `Valeur cible à fin d'échéance ${jalon}`,
        `Date valeur cible à fin d'échéance ${jalon}`,
        "Valeur cible à fin d'échéance 2026",
        "Date valeur cible à fin d'échéance 2026 (indicateur)",
        `Taux d'avancement à fin d'échéance ${jalon} (indicateur)`,
        "Taux d'avancement à fin d'échéance 2026 (indicateur)",
      );
    }

    if (optionsExport.listeOptionsExport.includes("description-chantier")) {
      headersColumn.push(
        `Taux d'avancement à fin d'échéance ${jalon} (chantier)`,
        "Taux d'avancement à fin d'échéance 2026 (chantier)",
      );
    }

    if (optionsExport.listeOptionsExport.includes("comparaison")) {
      // Aucune donnée pour le moment
    }

    if (optionsExport.listeOptionsExport.includes("synthese")) {
      headersColumn.push("Météo");
    }

    if (optionsExport.listeOptionsExport.includes("commentaire")) {
      // Aucune donnée pour le moment
    }

    if (optionsExport.listeOptionsExport.includes("decision")) {
      // Aucune donnée pour le moment
    }

    return headersColumn;
  };

  private indicateurRepository: IndicateurRepository;

  constructor({ indicateurRepository }: Dependencies) {
    this.indicateurRepository = indicateurRepository;
  }

  public async *run({
    chantierIds,
    territoireCodes,
    profil,
    indicateurChunkSize,
    optionsExport,
    jalon,
  }: {
    chantierIds: string[];
    territoireCodes: string[];
    profil: ProfilCode;
    indicateurChunkSize: number;
    optionsExport: OptionsExport;
    jalon: number;
  }): AsyncGenerator<string[][]> {
    for (let i = 0; i < chantierIds.length; i += indicateurChunkSize) {
      const partialChantierIds = chantierIds.slice(i, i + indicateurChunkSize);

      const estAvecCadrage =
        optionsExport.listeOptionsExport.includes("cadrage");

      const input = partialChantierIds.map((id) =>
        this.indicateurRepository
          .recupererPourExports(id, territoireCodes, jalon, estAvecCadrage)
          .then((listeIndicateurTerritoireExport) =>
            (listeIndicateurTerritoireExport || []).reduce(
              (acc, indicateursPourExport) => {
                if (
                  indicateursPourExport &&
                  !masquerPourProfilDROMEtMailleNat(
                    profil,
                    indicateursPourExport.périmètreIds,
                    indicateursPourExport.maille,
                  ) &&
                  verifierApplicabiliteMaille(
                    indicateursPourExport.maillesApplicables,
                    indicateursPourExport.maille,
                  ) &&
                  verifierOptionPerimetreIds(
                    optionsExport,
                    indicateursPourExport.périmètreIds,
                  ) &&
                  verifierOptionEstBarometreEtEstTerritorialise(
                    optionsExport,
                    indicateursPourExport.chantierEstBaromètre,
                  ) &&
                  verifierOptionStatut(
                    optionsExport,
                    indicateursPourExport.chantierStatut,
                  ) &&
                  verifierOptionMeteo(
                    optionsExport,
                    indicateursPourExport.météo,
                  ) &&
                  verifierOptionChantiersSignales(
                    optionsExport,
                    indicateursPourExport.chantierEcart,
                    indicateursPourExport.chantierTendance,
                    indicateursPourExport.chantierAvancementGlobal,
                    indicateursPourExport.chantierCibleAttendue,
                    indicateursPourExport.chantierAUnTauxAvancementDepartemental,
                    indicateursPourExport.météo ?? "NON_RENSEIGNEE",
                    indicateursPourExport.chantierAUnePropositionValeurAvancement,
                  )
                ) {
                  return [
                    ...acc,
                    presenterEnIndicateurExportContrat(
                      indicateursPourExport,
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
