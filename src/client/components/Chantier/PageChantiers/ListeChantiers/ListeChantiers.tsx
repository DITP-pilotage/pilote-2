import Tableau from '../../../_commons/Tableau/Tableau';
import Image from 'next/image';
import pictoSoleil from '/public/img/météo/soleil.svg';
import pictoSoleilNuage from '/public/img/météo/soleil-nuage.svg';
import pictoNuage from '/public/img/météo/nuage.svg';
import pictoOrage from '/public/img/météo/orage.svg';
import { createColumnHelper } from '@tanstack/react-table';
import ListeChantiersProps from './ListeChantiers.interface';
import { ChantierAvancementFront } from '@/client/interfaces/ChantierFront.interface';

export function mettreEnFormeLaMétéo(valeur: number | null) {
  switch (valeur) {
    case 1: {
      return (
        <Image
          alt="Sécurisé"
          src={pictoSoleil}
        />
      );
    }
    case 2: {
      return (
        <Image
          alt="Atteignable"
          src={pictoSoleilNuage}
        />
      );
    }
    case 3: {
      return (
        <Image
          alt="Appui nécessaire"
          src={pictoNuage}
        />
      );
    }
    case 4: {
      return (
        <Image
          alt="Compromis"
          src={pictoOrage}
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

function afficherUneBarreDeProgression(valeur: number | null) {
  if (valeur === null) {
    return (
      <span>
        Non renseigné
      </span>
    );
  }

  const pourcentageAvancement = valeur * 100;

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

function afficherLesBarresDeProgression(avancement: ChantierAvancementFront) {
  return (
    <>
      { afficherUneBarreDeProgression(avancement.global) }
      <br />
      { afficherUneBarreDeProgression(avancement.annuel) }
    </>
  );
}

const reactTableColonnesHelper = createColumnHelper<ListeChantiersProps['chantiers'][number]>();

const colonnes = [
  reactTableColonnesHelper.accessor('id', {
    header: 'Identifiant',
    cell: id => id.getValue(),
  }),
  reactTableColonnesHelper.accessor('nom', {
    header: 'Nom du chantier',
    cell: nomChantier => nomChantier.getValue(),
  }),
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    cell: météo => mettreEnFormeLaMétéo(météo.getValue()),
  }),
  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    cell: avancement => afficherLesBarresDeProgression(avancement.getValue()),
  }),
];

export default function ListeChantiers({ chantiers }: ListeChantiersProps) {
  return (
    <Tableau<typeof chantiers[number]>
      colonnes={colonnes}
      données={chantiers}
      entité="chantiers"
      titre="Liste des chantiers"
    />
  );
}
