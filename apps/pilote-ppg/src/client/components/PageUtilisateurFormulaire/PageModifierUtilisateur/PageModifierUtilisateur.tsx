import UtilisateurFormulaire from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire";
import FilAriane from "@/client/components/_commons/FilAriane/FilAriane";
import { pageModifierUtilisateur } from "@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateurServerSideContext";

const PageModifierUtilisateur = () => {
  const {
    utilisateur,
    estAutoriseAVoirLeSelecteurApplication,
    creationCompteArsActive,
  } = pageModifierUtilisateur.useServerSidePropsContext();

  const chemin = [{ nom: "Gestion des comptes", lien: "/admin/utilisateurs" }];

  return (
    <div className="bg-dsfr-alt-blue-france fr-pt-2w">
      <main className="fr-container">
        <FilAriane chemin={chemin} libelléPageCourante="Modifier un compte" />
        <div className="fr-pb-4w">
          <UtilisateurFormulaire
            estAutoriseAVoirLeSelecteurApplication={
              estAutoriseAVoirLeSelecteurApplication
            }
            creationCompteArsActive={creationCompteArsActive}
            utilisateur={utilisateur}
          />
        </div>
      </main>
    </div>
  );
};

export default PageModifierUtilisateur;
