import { PropositionValeurAvancementRapport } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { RapportDirecteurProjetChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import {
  ContenuRapport,
  ChantierRapport,
  IndicateurProposition,
} from "@/server/chantiers/domain/RapportPropositionsAvancement";

export const genererParametresEnvoieRapportProposition = (
  listeChantierIds: string[],
  mapChantiersInformation: Map<
    string,
    RapportDirecteurProjetChantierInformation
  >,
  propositionsParChantier: Map<
    string,
    Map<string, PropositionValeurAvancementRapport[]>
  >,
  indicateursNonAJourParChantier: Map<
    string,
    { id: string; nom: string; mailles: string[] }[]
  >,
): ContenuRapport => {
  const params: ChantierRapport[] = [];
  for (const chantierId of listeChantierIds.sort()) {
    const chantier = mapChantiersInformation.get(chantierId);
    if (!chantier) {
      continue;
    }

    const mapPropositionsChantier = propositionsParChantier.get(chantierId);
    const indicateursNonMisAJour =
      indicateursNonAJourParChantier.get(chantierId);

    let nombrePropositions = 0;

    const indicateursPropositions: IndicateurProposition[] = [];
    if (mapPropositionsChantier) {
      for (const [
        indicId,
        propositionsTerritoire,
      ] of mapPropositionsChantier.entries()) {
        const unite = propositionsTerritoire[0].uniteIndicateur;
        const nom = propositionsTerritoire[0].nomIndicateur;
        const suffixe =
          unite?.toLocaleLowerCase() === "pourcentage" ? " %" : "";

        indicateursPropositions.push({
          id: indicId,
          nom: nom,
          unite: unite ? `(en ${unite})` : "",
          territoires: propositionsTerritoire.map((p) => ({
            code: p.territoireCode,
            nom: p.nomTerritoire,
            valeur_avancement: p.valeurAvancementReference + suffixe,
            date_valeur: p.dateValeurAvancement,
            proposition: p.valeurAvancementProposee + suffixe,
          })),
        });

        nombrePropositions += propositionsTerritoire.length;
      }
    }

    const afficherSectionPropositions = indicateursPropositions.length > 0;
    const afficherSectionMajIndicateur = indicateursNonMisAJour
      ? indicateursNonMisAJour.length > 0
      : false;

    const nombreIndicateursNonMisAJour = indicateursNonMisAJour?.length ?? 0;
    if (afficherSectionMajIndicateur || afficherSectionPropositions) {
      params.push({
        nom_chantier: chantier.nom,
        id_chantier: chantier.id,
        nombre_propositions:
          nombrePropositions === 0
            ? "aucune proposition territoriale de valeur d'avancement"
            : nombrePropositions > 1
              ? `${nombrePropositions} propositions territoriales de valeur d'avancement`
              : `${nombrePropositions} proposition territoriale de valeur d'avancement`,
        conseiller_email: chantier.conseillerMail,
        afficherSectionPropositions,
        indicateursPropositions: indicateursPropositions,
        afficherSectionMajIndicateur,
        indicateursNonMisAJour: indicateursNonMisAJour ?? [],
        nombreIndicateursNonMisAJour:
          nombreIndicateursNonMisAJour === 0
            ? "aucun indicateur à mettre à jour"
            : nombreIndicateursNonMisAJour > 1
              ? `${nombreIndicateursNonMisAJour} indicateurs à mettre à jour`
              : `${nombreIndicateursNonMisAJour} indicateur à mettre à jour`,
      });
    }
  }

  return {
    chantiers: params,
    conseillerEmail: params.length > 0 ? params[0].conseiller_email : "",
    texteIntro:
      params.length > 1
        ? "vos chantiers prioritaires"
        : "votre chantier prioritaire",
  };
};
