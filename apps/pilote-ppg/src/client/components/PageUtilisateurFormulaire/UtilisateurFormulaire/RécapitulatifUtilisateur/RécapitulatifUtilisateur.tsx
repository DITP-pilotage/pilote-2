import Link from "next/link";
import { Button } from "@/components/shared/Button";
import useRécapitulatifUtilisateur from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/RécapitulatifUtilisateur/useRécapitulatifUtilisateur";
import FicheUtilisateur from "@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";

const RécapitulatifUtilisateur = ({
  auClicBoutonRetourCallback,
  utilisateurExistant,
}: {
  auClicBoutonRetourCallback: () => void;
  utilisateurExistant: boolean;
}) => {
  const { utilisateur, envoyerFormulaireUtilisateur, alerte } =
    useRécapitulatifUtilisateur();

  return (
    <div>
      <FicheUtilisateur utilisateur={utilisateur} />
      {!!alerte && (
        <div className="my-8">
          <Alerte titre={alerte.titre} type={alerte.type} />
        </div>
      )}
      <div className="flex-wrap mt-8 flex items-center gap-4">
        <Button
          iconLeft={<Icone className="h-4 w-4" icone={ArrowLine3Icon} />}
          onClick={auClicBoutonRetourCallback}
          variant="secondary"
        >
          Retour
        </Button>
        <Button
          onClick={() => envoyerFormulaireUtilisateur(utilisateurExistant)}
          variant="primary"
        >
          Confirmer
        </Button>
      </div>
      <div className="flex flex-wrap mt-6">
        <Link href="/admin/utilisateurs">Annuler</Link>
      </div>
    </div>
  );
};

export default RécapitulatifUtilisateur;
