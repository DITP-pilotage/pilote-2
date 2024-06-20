import BoutonsDeTri from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri';
import TableauChantiersActionsDeTriProps from '@/components/PageAccueil/PageChantiers/TableauChantiers/ActionsDeTri/TableauChantiersActionsDeTri.interface';
import TableauChantiersActionsDeTriStyled from '@/components/PageAccueil/PageChantiers/TableauChantiers/ActionsDeTri/TableauChantiersActionsDeTri.styled';

const listeColonnesÀtrier = [
  {
    libellé: 'Taux d\'avancement',
    colonneId: 'avancement',
  },
  {
    libellé: 'Météo',
    colonneId: 'météo',
  },
  {
    libellé: 'Mise à jour des données',
    colonneId: 'dateDeMàjDonnéesQuantitatives',
  },
  {
    libellé: 'Mise à jour de la météo et synthèse des résultats',
    colonneId: 'dateDeMàjDonnéesQualitatives',
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
