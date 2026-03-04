import { FunctionComponent } from "react";
import { formaterDate } from "@/client/utils/date/date";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import {
  getPerimetreLibelle,
  getServiceLibelle,
} from "@/client/constants/referentiel-services";

interface TableauUtilisateurProps {
  utilisateur: {
    nom: string;
    prénom: string;
    email: string;
    profil: ProfilCode;
    dateModification?: string;
    auteurModification?: string;
    dateCreation?: string;
    auteurCreation?: string;
    fonction: string | null;
    service?: string | null;
    serviceAutre?: string | null;
    perimetreMinisteriel?: string | null;
  };
}

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

const TableauUtilisateur: FunctionComponent<TableauUtilisateurProps> = ({
  utilisateur,
}) => {
  const perimetreLibelle = getPerimetreLibelle(
    utilisateur.perimetreMinisteriel,
  );
  const serviceLibelle = getServiceLibelle(
    utilisateur.perimetreMinisteriel,
    utilisateur.service,
    utilisateur.serviceAutre,
  );

  return (
    <div className="rounded-lg bg-blue-50 p-6 mb-4">
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">
        <Champ label="Adresse électronique" valeur={utilisateur.email} />
        <Champ label="Nom" valeur={utilisateur.nom} />
        <Champ label="Prénom" valeur={utilisateur.prénom} />
        <Champ label="Profil" valeur={utilisateur.profil} />
        <Champ label="Fonction" valeur={utilisateur.fonction} />
        <Champ label="Périmètre ministériel" valeur={perimetreLibelle} />
        <Champ label="Service" valeur={serviceLibelle} />
        {!!utilisateur.auteurCreation && (
          <Champ
            label="Création du compte"
            valeur={`${formaterDate(utilisateur.dateCreation, "DD/MM/YYYY")} par ${utilisateur.auteurCreation}`}
          />
        )}
        {!!utilisateur.auteurModification && (
          <Champ
            label="Dernière modification"
            valeur={`${formaterDate(utilisateur.dateModification, "DD/MM/YYYY")} par ${utilisateur.auteurModification}`}
          />
        )}
      </div>
    </div>
  );
};

export default TableauUtilisateur;
