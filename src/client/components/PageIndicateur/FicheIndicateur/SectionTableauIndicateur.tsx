import { FunctionComponent } from "react";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { InformationHistorisationMetadataIndicateurContrat } from "@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat";
import { formaterDate } from "@/client/utils/date/date";

const ChampCarteIdentite: FunctionComponent<{
  libellé: string;
  valeur: string;
}> = ({ libellé, valeur }) => (
  <div>
    <p className="mb-1 text-xs text-gray-500">{libellé}</p>
    <p className="m-0 text-sm font-bold truncate" title={valeur}>
      {valeur}
    </p>
  </div>
);

const SectionTableauIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  informationHistorisationIndicateur: InformationHistorisationMetadataIndicateurContrat;
}> = ({ indicateur, informationHistorisationIndicateur }) => {
  const creation = `${formaterDate(informationHistorisationIndicateur.dateCreation, "DD/MM/YYYY")} par ${informationHistorisationIndicateur.auteurCreation}`;
  const derniereModification = `${formaterDate(informationHistorisationIndicateur.dateDerniereModification, "DD/MM/YYYY")} par ${informationHistorisationIndicateur.auteurModification}`;

  return (
    <div className="rounded-lg bg-blue-50 p-6 m-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ChampCarteIdentite
          libellé="Chantier associé"
          valeur={indicateur.indicParentCh}
        />
        <ChampCarteIdentite
          libellé="Nom du chantier"
          valeur={indicateur.chantierNom}
        />
        <ChampCarteIdentite
          libellé="Identifiant indicateur"
          valeur={indicateur.indicId}
        />
        <ChampCarteIdentite
          libellé="Nom de l'indicateur"
          valeur={indicateur.indicNom}
        />
        <ChampCarteIdentite
          libellé="Création de l'indicateur"
          valeur={creation}
        />
        <ChampCarteIdentite
          libellé="Dernière modification"
          valeur={derniereModification}
        />
      </div>
    </div>
  );
};

export default SectionTableauIndicateur;
