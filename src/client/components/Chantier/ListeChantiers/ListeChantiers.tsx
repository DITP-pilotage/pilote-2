import Tableau from '../../_commons/Tableau/Tableau';
import Image from 'next/image';
import meteo1 from '/public/img/meteo-1-securise.svg';
import meteo2 from '/public/img/meteo-2-atteignable.svg';
import meteo3 from '/public/img/meteo-3-appui-necessaire.svg';
import meteo4 from '/public/img/meteo-4-compromis.svg';
import { createColumnHelper } from '@tanstack/react-table';
import ListeChantiersProps from './ListeChantiers.interface';

export function mettreEnFormeLaMétéo(valeur: number | null) {
  switch (valeur) {
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
    default: {
      return (
        <span>
          Non renseigné
        </span>
      );
    }
  }
}
        
export function afficherBarreDeProgression(avancement: number) {
  const pourcentageAvancement = avancement * 100;
  return (
    <>
      {pourcentageAvancement.toFixed(0)}
      %
      <progress
        max='100'
        value={pourcentageAvancement}
      >
        {pourcentageAvancement.toFixed(0)}
        %
      </progress>
    </>
  );
}

const columnHelper = createColumnHelper<ListeChantiersProps['chantiers'][number]>();

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
    cell: météo => {
      mettreEnFormeLaMétéo(météo.getValue());
    },
    enableGlobalFilter: false,
  }),
  columnHelper.accessor('avancement', {
    header: 'Avancement',
    cell: avancement => {
      const avancementValeur = avancement.getValue();
      return avancementValeur
        ? afficherBarreDeProgression(avancementValeur)
        : (
          <span>
            Non renseigné
          </span>
        );
    },
    enableGlobalFilter: false,
  }),
];

export default function ListeChantiers({ chantiers }: ListeChantiersProps) {
  return (
    <Tableau<typeof chantiers[number]>
      colonnes={colonnes}
      donnees={chantiers}
      entités="chantiers"
      titre="Liste des chantiers"
    />
  );
}