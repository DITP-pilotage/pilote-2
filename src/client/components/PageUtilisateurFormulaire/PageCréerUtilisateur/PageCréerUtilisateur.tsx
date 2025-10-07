import UtilisateurFormulaire from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire";
import FilAriane from "@/client/components/_commons/FilAriane/FilAriane";
import { pageCreerUtilisateur } from "@/components/PageUtilisateurFormulaire/PageCréerUtilisateur/PageCreerUtilisateurServerSideContext";
import PageCréerUtilisateurStyled from "./PageCréerUtilisateur.styled";

const PageCréerUtilisateur = () => {
  const { estAutoriseAVoirLeSelecteurApplication } =
    pageCreerUtilisateur.useServerSidePropsContext();
  const chemin = [{ nom: "Gestion des comptes", lien: "/admin/utilisateurs" }];

  return (
    <PageCréerUtilisateurStyled className="fr-pt-2w">
      <main className="fr-container">
        <FilAriane chemin={chemin} libelléPageCourante="Ajouter un compte" />
        <div className="fr-pb-4w">
          <UtilisateurFormulaire
            estAutoriseAVoirLeSelecteurApplication={
              estAutoriseAVoirLeSelecteurApplication
            }
          />
        </div>
      </main>
    </PageCréerUtilisateurStyled>
  );
};

export default PageCréerUtilisateur;
