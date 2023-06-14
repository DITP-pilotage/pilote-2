import Bouton from '@/components/_commons/Bouton/Bouton';
import useRécapitulatifUtilisateur
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/RécapitulatifUtilisateur/useRécapitulatifUtilisateur';
import FicheUtilisateur from '@/components/PageUtilisateur/FicheUtilisateur';

export default function RécapitulatifUtilisateur() {

  const { utilisateur, envoyerFormulaireUtilisateur } = useRécapitulatifUtilisateur();

  return (
    <div>
      <FicheUtilisateur
        chantiers={[]}
        utilisateur={utilisateur}
      />
      <Bouton
        label='Envoyer'
        onClick={envoyerFormulaireUtilisateur}
      />
    </div>
  );
}
