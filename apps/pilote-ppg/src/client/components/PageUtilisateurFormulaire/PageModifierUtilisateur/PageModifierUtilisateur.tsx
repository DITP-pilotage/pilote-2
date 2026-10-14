import UtilisateurFormulaire from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire";
import FilAriane from "@/client/components/_commons/FilAriane/FilAriane";
import { pageModifierUtilisateur } from "@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateurServerSideContext";

const PageModifierUtilisateur = () => {
  const { utilisateur } = pageModifierUtilisateur.useServerSidePropsContext();

  const chemin = [{ nom: "Gestion des comptes", lien: "/admin/utilisateurs" }];

  return (
    <div className="bg-dsfr-alt-blue-france pt-4">
      <main className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem]">
        <FilAriane chemin={chemin} libelléPageCourante="Modifier un compte" />
        <div className="pb-8">
          <UtilisateurFormulaire utilisateur={utilisateur} />
        </div>
      </main>
    </div>
  );
};

export default PageModifierUtilisateur;
