import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';
import styles from './Responsables.module.scss';

const nonRenseigné = 'Non renseigné';

const responsables = [
  { libellé: 'Ministère porteur', nom: nonRenseigné, id: 1 },
  { libellé: 'Autres ministères co-porteurs', nom: nonRenseigné, id: 2 },
  { libellé: 'Directeur d’Administration Centrale', nom: nonRenseigné, id: 3 },
  { libellé: 'Nom du Directeur de Projet', nom: nonRenseigné, id: 4 },
];

export default function Responsables() {
  return (
    <section
      className={styles.conteneur}
    >
      <Titre
        baliseHtml='h2'
        id="responsables"
      >
        Responsables
      </Titre>
      <CarteSquelette>
        <div className='fr-p-2w fr-mb-2w carteEnTête'>
          National
        </div>
        {responsables.map(responsable => (
          <div key={responsable.id}>
            <div className='fr-pl-2w fr-grid-row'>
              <p className='fr-text--sm fr-text--bold fr-col fr-mr-4w'>
                {responsable.libellé}
              </p>
              <p className='fr-text--sm fr-col'>
                {responsable.nom}
              </p>
            </div>
            <hr className='fr-hr' />
          </div>
        ))}
      </CarteSquelette>
    </section>
  );
}
