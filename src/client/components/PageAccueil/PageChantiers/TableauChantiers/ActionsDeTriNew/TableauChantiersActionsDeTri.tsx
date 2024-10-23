import { FunctionComponent } from 'react';
import { parseAsJson, useQueryState } from 'nuqs';
import { z } from 'zod';
import SélecteurCustom from '@/components/_commons/SelecteurCustom/SélecteurAvecRecherche/SélecteurCustom';
import BoutonsDeTri from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri';
import TableauChantiersActionsDeTriStyled
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/ActionsDeTri/TableauChantiersActionsDeTri.styled';

interface TableauChantiersActionsDeTriProps {
}

const listeColonnesÀtrier = [
  {
    libellé: 'Taux d\'avancement',
    valeur: 'avancement',
    désactivé: false,
  },
  {
    libellé: 'Météo',
    valeur: 'météo',
    désactivé: false,
  },
  {
    libellé: 'Date de mise à jour des données',
    valeur: 'dateDeMàjDonnéesQuantitatives',
    désactivé: process.env.NEXT_PUBLIC_FF_TRI_DATES !== 'true',
  },
  {
    libellé: 'Date de mise à jour de la météo et de la synthèse des résultats',
    valeur: 'dateDeMàjDonnéesQualitatives',
    désactivé: process.env.NEXT_PUBLIC_FF_TRI_DATES !== 'true',
  },
  {
    libellé: 'Tendance',
    valeur: 'tendance',
    désactivé: false,
  },
  {
    libellé: 'Écart',
    valeur: 'écart',
    désactivé: false,
  },
];

const ZodSchemaSorting = z.object(
  {
    id: z.string().regex(/avancement|météo|dateDeMàjDonnéesQuantitatives|dateDeMàjDonnéesQualitatives|tendance|écart/),
    desc: z.boolean(),
  },
);

export const TableauChantiersActionsDeTri: FunctionComponent<TableauChantiersActionsDeTriProps> = ({}) => {

  const [sorting, setSorting] = useQueryState('sort', parseAsJson(ZodSchemaSorting.parse).withDefault({
    id: 'avancement',
    desc: true,
  }).withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));

  return (
    <TableauChantiersActionsDeTriStyled>
      <div className='fr-select-group sélecteur-colonne-à-trier'>
        <label
          className='fr-label label'
          htmlFor='tri-tableau-chantiers'
        >
          Trier par
        </label>
        <SélecteurCustom
          htmlName='tri-tableau-chantiers'
          options={listeColonnesÀtrier}
          valeurModifiéeCallback={triSélectionné => setSorting({
            id: triSélectionné,
            desc: true,
          })}
          valeurSélectionnée={sorting.id}
        />
      </div>
      <div className='fr-mb-4w fr-ml-1w'>
        <BoutonsDeTri
          changementDirectionDeTriCallback={direction => setSorting({
            id: sorting.id,
            desc: direction === 'desc',
          })}
          directionDeTri={sorting.desc ? 'desc' : 'asc'}
          nomColonneÀTrier={sorting.id}
        />
      </div>
    </TableauChantiersActionsDeTriStyled>
  );
};
