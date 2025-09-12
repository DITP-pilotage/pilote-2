import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { ListeDeDroit } from "@/components/PageUtilisateur/DétailsDroitsUtilisateur/ListeDeDroit";

interface DétailsDroitsUtilisateurProps {
  titre: string;
  territoires: string[];
  chantiers: string[];
  labelTerritoires?: string;
  labelChantiers?: string;
}

export const DetailsDroitsUtilisateur: FunctionComponent<
  DétailsDroitsUtilisateurProps
> = ({
  titre,
  territoires,
  chantiers,
  labelTerritoires = "Droits ouverts pour les territoires",
  labelChantiers = "Droits ouverts pour les chantiers",
}) => {
  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        {titre}
      </Titre>
      <div className="fr-grid-row">
        <ListeDeDroit label={labelTerritoires} listeElement={territoires} />
        <ListeDeDroit label={labelChantiers} listeElement={chantiers} />
      </div>
      <hr className="fr-hr fr-mt-3w" />
    </div>
  );
};
