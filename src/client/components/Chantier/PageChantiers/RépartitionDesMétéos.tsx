import Titre from '@/components/_commons/Titre/Titre';
import ÉlémentDeRépartitionDesMétéos from './ÉlémentDeRépartitionDesMétéos/ÉlémentDeRépartitionDesMétéos';
import pictoSoleil from '/public/img/météo/soleil.svg';
import pictoSoleilNuage from '/public/img/météo/soleil-nuage.svg';
import pictoNuage from '/public/img/météo/nuage.svg';
import pictoOrage from '/public/img/météo/orage.svg';

const météos = [
  { label: 'Objectifs sécurisés', picto: pictoSoleil },
  { label: 'Objectifs atteignables', picto: pictoSoleilNuage },
  { label: 'Appuis nécessaires', picto: pictoNuage },
  { label: 'Objectifs compromis', picto: pictoOrage },
];

export default function RépartitionDesMétéos() {
  return (
    <>
      <Titre
        apparence='fr-h6'
        baliseHtml='h2'
      >
        Répartition des météos de la sélection
      </Titre>
      <ul className='fr-grid-row'>
        {
          météos.map(météo => (
            <li
              className='fr-col-6 fr-col-md-3'
              key={météo.label}
            >
              <ÉlémentDeRépartitionDesMétéos
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
