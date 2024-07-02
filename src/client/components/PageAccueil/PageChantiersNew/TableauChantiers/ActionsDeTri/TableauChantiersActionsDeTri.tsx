import BoutonsDeTri from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri';
import TableauChantiersActionsDeTriProps from '@/components/PageAccueil/PageChantiers/TableauChantiers/ActionsDeTri/TableauChantiersActionsDeTri.interface';
import TableauChantiersActionsDeTriStyled from '@/components/PageAccueil/PageChantiers/TableauChantiers/ActionsDeTri/TableauChantiersActionsDeTri.styled';

const listeColonnesÀtrier = [
  {
    libellé: 'Taux d\'avancement',
    colonneId: 'avancement',
    accessible: true,
  },
  {
    libellé: 'Météo',
    colonneId: 'météo',
    accessible: true,
  },
  {
    libellé: 'Date de mise à jour des données',
    colonneId: 'dateDeMàjDonnéesQuantitatives',
    accessible: process.env.NEXT_PUBLIC_FF_TRI_DATES === 'true',
  },
  {
    libellé: 'Date de mise à jour de la météo et de la synthèse des résultats',
    colonneId: 'dateDeMàjDonnéesQualitatives',
    accessible: process.env.NEXT_PUBLIC_FF_TRI_DATES === 'true',
  },
];

export default function TableauChantiersActionsDeTri({
  changementColonneÀTrierCallback,
  changementDirectionDeTriCallback,
  colonneÀTrier,
  directionDeTri,
}: TableauChantiersActionsDeTriProps) {
  return (
    <TableauChantiersActionsDeTriStyled>
      <div className='fr-select-group sélecteur-colonne-à-trier'>
        <label
          className='fr-label label'
          htmlFor='tri-tableau-chantiers'
        >
          Trier par
        </label>
        <select
          className='fr-select'
          id='tri-tableau-chantiers'
          name='tri-tableau-chantiers'
          onChange={(événement) => changementColonneÀTrierCallback(événement.currentTarget.value)}
          title='Trier par'
          value={colonneÀTrier}
        >
          {
            listeColonnesÀtrier.map(option => (
              option.accessible &&
              <option
                key={option.colonneId}
                title={option.libellé}
                value={option.colonneId}
              >
                {option.libellé}
              </option>
            ))
          }
        </select>
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
}
