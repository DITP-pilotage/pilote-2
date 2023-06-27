import Bouton from '@/components/_commons/Bouton/Bouton';
import useRécapitulatifUtilisateur
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/RécapitulatifUtilisateur/useRécapitulatifUtilisateur';
import FicheUtilisateur from '@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur';
import Alerte from '@/components/_commons/Alerte/Alerte';

export default function RécapitulatifUtilisateur() {
  const { utilisateur, envoyerFormulaireUtilisateur, alerte } = useRécapitulatifUtilisateur();

  return (
    <div>
      <FicheUtilisateur
        utilisateur={utilisateur}
      />
      {
        !!alerte &&
          <div className='fr-my-4w'>
            <Alerte
              titre={alerte.titre}
              type={alerte.type}
            />
          </div>
      }
      <Bouton
        label='Envoyer'
        onClick={envoyerFormulaireUtilisateur}
      />
    </div>
  );
}
