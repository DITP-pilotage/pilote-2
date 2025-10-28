import { PropositionValeurAvancementRapport } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { RapportDirecteurProjetChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";

type ParamIndicateurPropositions = {
  id: string;
  nom: string;
  unite: string;
  territoires: {
    code: string;
    nom: string;
    valeur_avancement: string;
    date_valeur: string;
    proposition: string;
  }[];
};
type ParametreEnvoieRapportProposition = {
  nom_chantier: string;
  id_chantier: string;
  nombre_propositions: string;
  conseiller_email: string;
  afficherSectionPropositions: boolean;
  indicateursPropositions: ParamIndicateurPropositions[];
  afficherSectionMajIndicateur: boolean;
  indicateursNonMisAJour: string[];
};

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
  indicateursNonAJourParChantier: Map<string, string[]>,
): {
  chantiers: ParametreEnvoieRapportProposition[];
  conseillerEmail: string;
} => {
  const params: ParametreEnvoieRapportProposition[] = [];
  for (const chantierId of listeChantierIds) {
    const chantier = mapChantiersInformation.get(chantierId);
    if (!chantier) {
      continue;
    }

    const mapPropositionsChantier = propositionsParChantier.get(chantierId);
    const indicateursNonMisAJour =
      indicateursNonAJourParChantier.get(chantierId);

    let nombrePropositions = 0;

    const indicateursPropositions: ParamIndicateurPropositions[] = [];
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

    if (afficherSectionMajIndicateur || afficherSectionPropositions) {
      params.push({
        nom_chantier: chantier.nom,
        id_chantier: chantier.id,
        nombre_propositions:
          nombrePropositions > 1
            ? `${nombrePropositions} propositions territoriales de valeur d'avancement`
            : "1 proposition territoriale de valeur d'avancement",
        conseiller_email: chantier.conseillerMail,
        afficherSectionPropositions,
        indicateursPropositions: indicateursPropositions,
        afficherSectionMajIndicateur,
        indicateursNonMisAJour: indicateursNonMisAJour ?? [],
      });
    }
  }

  return { chantiers: params, conseillerEmail: params[0].conseiller_email };
};
