import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { DetailsDroitsUtilisateur } from "@/components/PageUtilisateur/DétailsDroitsUtilisateur/DetailsDroitsUtilisateur";
import TableauUtilisateur from "@/components/PageUtilisateur/TableauUtilisateur/TableauUtilisateur";
import useFicheUtilisateur from "@/components/PageUtilisateur/FicheUtilisateur/useFicheUtilisateur";
import FicheUtilisateurStyled from "@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur.styled";
import { formaterDate } from "@/client/utils/date/date";
import FicheUtilisateurProps from "./FicheUtilisateur.interface";

const FicheUtilisateur: FunctionComponent<FicheUtilisateurProps> = ({
  utilisateur,
}) => {
  const { scopes, chantiers } = useFicheUtilisateur(utilisateur);

  return (
    <FicheUtilisateurStyled>
      <Titre baliseHtml="h2" className="fr-h5">
        Utilisateur
      </Titre>
      {!!utilisateur.dateDesactivation && (
        <p className="fr-badge fr-badge--error fr-badge--no-icon">
          {`Désactivé depuis le ${formaterDate(utilisateur.dateDesactivation, "DD/MM/YYYY")}`}
        </p>
      )}
      <TableauUtilisateur utilisateur={utilisateur} />
      <DetailsDroitsUtilisateur
        chantiers={scopes.lecture.chantiers}
        listeInformationsChantiers={chantiers!}
        territoires={scopes.lecture.territoires}
        titre="Droits de lecture"
      />
      <DetailsDroitsUtilisateur
        chantiers={scopes.responsabilite.chantiers}
        labelChantiers="Responsabilité pour les chantiers"
        labelTerritoires="Responsabilité pour les territoires"
        listeInformationsChantiers={chantiers!}
        territoires={scopes.responsabilite.territoires}
        titre="Responsabilité"
      />
      <DetailsDroitsUtilisateur
        chantiers={scopes["saisieIndicateur"].chantiers}
        listeInformationsChantiers={chantiers!}
        territoires={scopes["saisieIndicateur"].territoires}
        titre="Droits de saisie des données quantitatives"
      />
      <DetailsDroitsUtilisateur
        chantiers={scopes["saisieCommentaire"].chantiers}
        listeInformationsChantiers={chantiers!}
        territoires={scopes["saisieCommentaire"].territoires}
        titre="Droits de saisie des commentaires"
      />
      <DetailsDroitsUtilisateur
        chantiers={scopes["gestionUtilisateur"].chantiers}
        listeInformationsChantiers={chantiers!}
        territoires={scopes["gestionUtilisateur"].territoires}
        titre="Droits de gestion des utilisateurs"
      />
    </FicheUtilisateurStyled>
  );
};

export default FicheUtilisateur;
