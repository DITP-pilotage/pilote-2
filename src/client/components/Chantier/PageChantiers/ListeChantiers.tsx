import '@gouvfr/dsfr/dist/component/table/table.min.css';
import Tableau from 'client/components/_commons/Tableau/Tableau';
import Image from 'next/image';
import meteo1 from '/public/img/meteo-1-securise.svg';
import meteo2 from '/public/img/meteo-2-atteignable.svg';
import meteo3 from '/public/img/meteo-3-appui-necessaire.svg';
import meteo4 from '/public/img/meteo-4-compromis.svg';
import { createColumnHelper } from '@tanstack/react-table';

function recupererPictoMeteoAPartirDeLaValeur(meteoValeur: number) {
  switch (meteoValeur) {
    case 1: {
      return (
        <Image
          alt="Meteo 1"
          src={meteo1}
        />
      );
    }
    case 2: {
      return (
        <Image
          alt="Meteo 2"
          src={meteo2}
        />
      );
    }
    case 3: {
      return (
        <Image
          alt="Meteo 3"
          src={meteo3}
        />
      );
    }
    case 4: {
      return (
        <Image
          alt="Meteo 4"
          src={meteo4}
        />
      );
    }
  }
}
        
function afficherBarreDeProgression(avancement: number) {
  const pourcentageAvancement = avancement * 100;
          
  return (
    <>
      {pourcentageAvancement}
      %
      <progress
        max='100'
        value={pourcentageAvancement}
      >
        {pourcentageAvancement}
        %
      </progress>
    </>
  );
}

const columnHelper = createColumnHelper<Chantier>();
  
const chantiers: Chantier[] = [
  {
    nom: 'Déployer le programme FR',
    meteo: 2,
    avancement: 0.6,
    id: 1,
  },
  {
    nom: 'Lutter contre la fraude fiscale',
    meteo: 1,
    avancement: 0.3,
    id: 2,
  },
  {
    nom: 'Elections du maire',
    meteo: 4,
    avancement: 0.9,
    id: 3,
  },
];
  
const colonnes = [
  columnHelper.accessor('id', {
    header: '#',
    cell: id => '#' + id.getValue(),
  }),
  columnHelper.accessor('nom', {
    header: 'Nom du chantier',
    cell: nomChantier => nomChantier.getValue(),
  }),
  columnHelper.accessor('meteo', {
    header: 'Météo',
    cell: meteo => recupererPictoMeteoAPartirDeLaValeur(meteo.getValue()),
  }),
  columnHelper.accessor('avancement', {
    header: 'Avancement',
    cell: avancement => afficherBarreDeProgression(avancement.getValue()),
  }),
];

type Chantier = {
  id: number,
  nom: string,
  meteo: number,
  avancement: number
};
  
export default function ListeChantiers() {
  return (
    <Tableau<Chantier>
      colonnes={colonnes}
      donnees={chantiers}
      titre="Liste des chantiers"
    />
  );
}