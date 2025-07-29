import { PropositionValeurAvancementRapport } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { PropositionValeurAvancementChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";

type ParamIndicateur = {
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
  indicateurs: ParamIndicateur[];
};

export const genererParametresEnvoieRapportProposition = (
  listeChantierIds: string[],
  mapChantiersPropositionInformation: Map<
    string,
    PropositionValeurAvancementChantierInformation
  >,
  propositionsParChantier: Map<
    string,
    Map<string, PropositionValeurAvancementRapport[]>
  >,
): {
  chantiers: ParametreEnvoieRapportProposition[];
  conseillerEmail: string;
} => {
  const params: ParametreEnvoieRapportProposition[] = [];
  for (const chantierId of listeChantierIds) {
    const chantier = mapChantiersPropositionInformation.get(chantierId);
    if (!chantier) {
      continue;
    }

    const mapPropositionsChantier = propositionsParChantier.get(chantierId);
    if (!mapPropositionsChantier) {
      continue;
    }

    let nombrePropositions = 0;

    const indicateurs: ParamIndicateur[] = [];
    for (const [
      indicId,
      propositionsTerritoire,
    ] of mapPropositionsChantier.entries()) {
      const unite = propositionsTerritoire[0].uniteIndicateur;
      const nom = propositionsTerritoire[0].nomIndicateur;
      const suffixe = unite?.toLocaleLowerCase() === "pourcentage" ? " %" : "";

      indicateurs.push({
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

    if (indicateurs.length > 0) {
      params.push({
        nom_chantier: chantier.nom,
        id_chantier: chantier.id,
        nombre_propositions:
          nombrePropositions > 1
            ? `${nombrePropositions} propositions territoriales de valeur d'avancement`
            : "1 proposition territoriale de valeur d'avancement",
        conseiller_email: chantier.conseillerMail,
        indicateurs,
      });
    }
  }

  return { chantiers: params, conseillerEmail: params[0].conseiller_email };
};
