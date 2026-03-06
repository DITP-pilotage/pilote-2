import Link from "next/link";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import useRécapitulatifUtilisateur from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/RécapitulatifUtilisateur/useRécapitulatifUtilisateur";
import FicheUtilisateur from "@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";

const RécapitulatifUtilisateur = ({
  auClicBoutonRetourCallback,
  utilisateurExistant,
}: {
  auClicBoutonRetourCallback: () => void;
  utilisateurExistant: boolean;
}) => {
  const { utilisateur, envoyerFormulaireUtilisateur } =
    useRécapitulatifUtilisateur();

  return (
    <div>
      <FicheUtilisateur utilisateur={utilisateur} />
      <div className="fr-grid-row !mt-8 flex items-center gap-4">
        <Bouton
          iconLeft={<Icone className="h-4 w-4" icone={ArrowLine3Icon} />}
          label="Retour"
          onClick={auClicBoutonRetourCallback}
          variant="secondary"
        />
        <Bouton
          label="Confirmer"
          onClick={() => envoyerFormulaireUtilisateur(utilisateurExistant)}
          variant="primary"
        />
      </div>
      <div className="fr-grid-row fr-mt-3w">
        <Link href="/admin/utilisateurs">Annuler</Link>
      </div>
    </div>
  );
};

export default RécapitulatifUtilisateur;
