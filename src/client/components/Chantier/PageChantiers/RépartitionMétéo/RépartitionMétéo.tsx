import Titre from '@/components/_commons/Titre/Titre';
import RépartitionMétéoÉlément from './RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import pictoSoleil from '/public/img/météo/soleil.svg';
import pictoSoleilNuage from '/public/img/météo/soleil-nuage.svg';
import pictoNuage from '/public/img/météo/nuage.svg';
import pictoOrage from '/public/img/météo/orage.svg';
import styles from './RépartitionMétéo.module.scss';

const météos = [
  { label: 'Objectifs compromis', picto: pictoOrage },
  { label: 'Appuis nécessaires', picto: pictoNuage },
  { label: 'Objectifs atteignables', picto: pictoSoleilNuage },
  { label: 'Objectifs sécurisés', picto: pictoSoleil },
];

export default function RépartitionMétéo() {
  return (
    <>
      <Titre
        apparence='fr-h6'
        baliseHtml='h2'
      >
        Répartition des météos de la sélection
      </Titre>
      <ul className={`${styles.listeMétéo} fr-grid-row fr-grid-row--gutters`}>
        {
          météos.map(météo => (
            <li
              className='fr-col-3'
              key={météo.label}
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
