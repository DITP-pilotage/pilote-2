import { FunctionComponent } from 'react';
import SélecteurCustom from '@/components/_commons/SelecteurCustom/SélecteurAvecRecherche/SélecteurCustom';
import BoutonsDeTri, { DirectionDeTri } from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri';
import TableauChantiersActionsDeTriStyled
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/ActionsDeTri/TableauChantiersActionsDeTri.styled';
  
interface TableauChantiersActionsDeTriProps {
  changementColonneÀTrierCallback: (colonneId: string) => void;
  colonneÀTrier: string;
  changementDirectionDeTriCallback: (directionTri: DirectionDeTri) => void;
  directionDeTri: DirectionDeTri;
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
];

const TableauChantiersActionsDeTri: FunctionComponent<TableauChantiersActionsDeTriProps> = ({
  changementColonneÀTrierCallback,
  changementDirectionDeTriCallback,
  colonneÀTrier,
  directionDeTri,
}) => {
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
          valeurModifiéeCallback={triSélectionné => changementColonneÀTrierCallback(triSélectionné)}
          valeurSélectionnée={colonneÀTrier}
        />
      </div>
      <div className='fr-mb-4w fr-ml-1w'>
        <BoutonsDeTri
          changementDirectionDeTriCallback={changementDirectionDeTriCallback}
          directionDeTri={directionDeTri}
          nomColonneÀTrier={colonneÀTrier}
        />
      </div>
    </TableauChantiersActionsDeTriStyled>
  );
};

export default TableauChantiersActionsDeTri;
