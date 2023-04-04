import BoutonsDeTri from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri';
import ActionsDeTriProps from '@/components/PageChantiers/TableauChantiers/ActionsDeTri/ActionsDeTri.interface';
import ActionsDeTriStyled from '@/components/PageChantiers/TableauChantiers/ActionsDeTri/ActionsDeTri.styled';

export default function ActionsDeTri({
  listeColonnesÀtrier,
  colonneÀTrier,
  changementColonneÀTrierCallback,
  changementDirectionDeTriCallback,
  directionDeTri,
}: ActionsDeTriProps) {
  return (
    <ActionsDeTriStyled>
      <div className="fr-select-group sélecteur-colonne-à-trier">
        <label
          className="fr-label"
          htmlFor="tri-tableau-chantiers"
        >
          Trier par
        </label>
        <select
          className="fr-select"
          id="tri-tableau-chantiers"
          name="tri-tableau-chantiers"
          onChange={(événement) => changementColonneÀTrierCallback(événement.currentTarget.value)}
        >
          {
            listeColonnesÀtrier.map(option => (
              <option
                key={option.colonneId}
                selected={colonneÀTrier === option.colonneId}
                value={option.colonneId}
              >
                {option.libellé}
              </option>
            ))
          }
        </select>
      </div>
      <div className="fr-mb-4w fr-ml-2w">
        <BoutonsDeTri
          changementDirectionDeTriCallback={changementDirectionDeTriCallback}
          directionDeTri={directionDeTri}
          nomColonneÀTrier={colonneÀTrier}
        />
      </div>
    </ActionsDeTriStyled>
  );
}
