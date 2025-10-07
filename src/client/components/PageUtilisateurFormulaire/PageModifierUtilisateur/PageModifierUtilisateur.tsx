import UtilisateurFormulaire from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire";
import FilAriane from "@/client/components/_commons/FilAriane/FilAriane";
import { pageModifierUtilisateur } from "@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateurServerSideContext";
import PageModifierUtilisateurStyled from "./PageModifierUtilisateur.styled";

const PageModifierUtilisateur = () => {
  const { utilisateur, estAutoriseAVoirLeSelecteurApplication } =
    pageModifierUtilisateur.useServerSidePropsContext();

  const chemin = [{ nom: "Gestion des comptes", lien: "/admin/utilisateurs" }];

  return (
    <PageModifierUtilisateurStyled className="fr-pt-2w">
      <main className="fr-container">
        <FilAriane chemin={chemin} libelléPageCourante="Modifier un compte" />
        <div className="fr-pb-4w">
          <UtilisateurFormulaire
            estAutoriseAVoirLeSelecteurApplication={
              estAutoriseAVoirLeSelecteurApplication
            }
            utilisateur={utilisateur}
          />
        </div>
      </main>
    </PageModifierUtilisateurStyled>
  );
};

export default PageModifierUtilisateur;
