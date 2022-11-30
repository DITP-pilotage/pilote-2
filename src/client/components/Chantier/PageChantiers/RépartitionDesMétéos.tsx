import Title from 'client/components/_commons/Title/Title';
import ÉlémentDeRépartitionDesMétéos from './ÉlémentDeRépartitionDesMétéos/ÉlémentDeRépartitionDesMétéos';
import meteo1 from '../../../../../public/img/meteo-1-securise.svg';
import meteo2 from '../../../../../public/img/meteo-2-atteignable.svg';
import meteo3 from '../../../../../public/img/meteo-3-appui-necessaire.svg';
import meteo4 from '../../../../../public/img/meteo-4-compromis.svg';

const météos = [
  { label: 'Objectifs sécurisés', picto: meteo1 },
  { label: 'Objectifs atteignables', picto: meteo2 },
  { label: 'Appuis nécessaires', picto: meteo3 },
  { label: 'Objectifs compromis', picto: meteo4 },
];

export default function RépartitionDesMétéos() {
  return (
    <>
      <Title
        as='h3'
        look='fr-h6'
      >
        Répartition des météos de la sélection
      </Title>
      <div className='fr-grid-row'>
        {
          météos.map(météo => (
            <div
              className='fr-col-3'
              key={météo.label}
            >
              <ÉlémentDeRépartitionDesMétéos
                météo={météo}
                nombreDeChantiers={5}
              />
            </div>
          ))
        }
      </div>
    </>
  );
}