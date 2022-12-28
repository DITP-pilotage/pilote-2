import Titre from '@/components/_commons/Titre/Titre';
import { météos } from '@/components/_commons/PictoMétéo/PictoMétéo';
import RépartitionMétéoÉlément from './RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import styles from './RépartitionMétéo.module.scss';

export default function RépartitionMétéo() {
  return (
    <>
      <Titre
        baliseHtml='h2'
        className='fr-h6'
      >
        Répartition des météos de la sélection
      </Titre>
      <ul className={`${styles.listeMétéo} fr-grid-row fr-grid-row--gutters`}>
        {
           Object.values(météos).reverse().map(météo => (
             <li
               className='fr-col-3'
               key={météo.nom}
             >
               <RépartitionMétéoÉlément
                 météo={météo}
                 nombreDeChantiers={5}
               />
             </li>
           ))
        }
      </ul>
    </>
  );
}
