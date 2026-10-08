import { FunctionComponent } from "react";
import { ListeDeDroit } from "@/components/PageUtilisateur/DétailsDroitsUtilisateur/ListeDeDroit";
import { InformationChantierUtilisateur } from "@/server/gestion-utilisateur/domain/InformationChantierUtilisateur";
import useDetailsDroitsUtilisateur from "./UseDetailsDroitsUtilisateur";

interface DétailsDroitsUtilisateurProps {
  titre: string;
  territoires: string[];
  chantiers: string[];
  labelTerritoires?: string;
  labelChantiers?: string;
  listeInformationsChantiers: InformationChantierUtilisateur[];
}

export const DetailsDroitsUtilisateur: FunctionComponent<
  DétailsDroitsUtilisateurProps
> = ({
  titre,
  territoires,
  chantiers,
  labelTerritoires = "Droits ouverts pour les territoires",
  labelChantiers = "Droits ouverts pour les chantiers",
  listeInformationsChantiers,
}) => {
  const { listeElementsChantiers, listeElementsTerritoires } =
    useDetailsDroitsUtilisateur({
      territoires,
      chantiers,
      listeInformationsChantiers,
    });
  return (
    <div>
      <h2 className="text-h5 md:text-h5-md text-primary">{titre}</h2>
      <div className="fr-grid-row">
        <ListeDeDroit
          label={labelTerritoires}
          listeElement={listeElementsTerritoires}
        />
        <ListeDeDroit
          label={labelChantiers}
          listeElement={listeElementsChantiers}
        />
      </div>
      <hr className="fr-hr fr-mt-3w" />
    </div>
  );
};
