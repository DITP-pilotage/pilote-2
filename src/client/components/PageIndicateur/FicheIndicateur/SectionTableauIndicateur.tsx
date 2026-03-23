import { FunctionComponent } from "react";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { InformationHistorisationMetadataIndicateurContrat } from "@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat";
import { formaterDate } from "@/client/utils/date/date";

const Champ = ({
  label,
  valeur,
}: {
  label: string;
  valeur: string | null | undefined;
}) => (
  <div className="min-w-0">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p
      className="text-sm font-bold text-gray-900 truncate mb-0"
      title={valeur ?? undefined}
    >
      {valeur || "-"}
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
    <div className="rounded-lg bg-blue-50 p-6 mb-4">
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">
        <Champ label="Chantier associé" valeur={indicateur.indicParentCh} />
        <Champ label="Nom du chantier" valeur={indicateur.chantierNom} />
        <Champ label="Identifiant indicateur" valeur={indicateur.indicId} />
        <Champ label="Nom de l'indicateur" valeur={indicateur.indicNom} />
        <Champ label="Création de l'indicateur" valeur={creation} />
        <Champ label="Dernière modification" valeur={derniereModification} />
      </div>
    </div>
  );
};

export default SectionTableauIndicateur;
