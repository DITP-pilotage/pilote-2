import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';
import styles from './Responsables.module.scss';

const nonRenseigné = 'Non renseigné';

const responsables = [
  { libellé: 'Ministère porteur', nom: nonRenseigné },
  { libellé: 'Autres ministères co-porteurs', nom: nonRenseigné },
  { libellé: 'Directeur d’Administration Centrale', nom: nonRenseigné },
  { libellé: 'Nom du Directeur de Projet', nom: nonRenseigné },
];

export default function Responsables() {
  return (
    <div
      className={styles.conteneur}
      id="responsables"
    >
      <Titre baliseHtml='h2'>
        Responsables
      </Titre>
      <CarteSquelette>
        <div className='fr-p-2w fr-mb-2w carteEnTête'>
          National
        </div>
        {responsables.map(responsable => (
          <>
            <div className='fr-pl-2w fr-grid-row'>
              <p className='fr-text--sm fr-text--bold fr-col fr-mr-4w'>
                {responsable.libellé}
              </p>
              <p className='fr-text--sm fr-col'>
                {responsable.nom}
              </p>
            </div>
            <hr className='fr-hr' />
          </>
        ))}
      </CarteSquelette>
    </div>
  );
}
