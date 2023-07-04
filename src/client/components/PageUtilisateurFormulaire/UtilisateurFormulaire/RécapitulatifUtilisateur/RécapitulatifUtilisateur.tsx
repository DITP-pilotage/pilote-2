import Link from 'next/link';
import Bouton from '@/components/_commons/Bouton/Bouton';
import useRécapitulatifUtilisateur from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/RécapitulatifUtilisateur/useRécapitulatifUtilisateur';
import FicheUtilisateur from '@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur';
import Alerte from '@/components/_commons/Alerte/Alerte';
import RécapitulatifUtilisateurProps from './RécapitulatifUtilisateur.interface';

export default function RécapitulatifUtilisateur({ auClicBoutonRetourCallback, utilisateurExistant }: RécapitulatifUtilisateurProps) {
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
      <div className="fr-grid-row fr-grid-row--right fr-mt-4w">
        <Bouton
          className='fr-btn--secondary fr-btn--icon-left fr-icon-arrow-left-line fr-mr-2w'
          label="Retour"
          onClick={auClicBoutonRetourCallback}
        />
        <Bouton
          label="Confirmer"
          onClick={() => envoyerFormulaireUtilisateur(utilisateurExistant)}
        />
      </div>
      <div className="fr-grid-row fr-grid-row--right fr-mt-3w">
        <Link 
          href='/admin/utilisateurs'
        >
          Annuler
        </Link>
      </div>
    </div>
  );
}
