import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { ChangeEvent, Fragment, useCallback, useMemo, useState } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import SélecteurMultipleProps from './SélecteurMultiple.interface';
import SélecteurMultipleStyled from './SélecteurMultiple.styled';

export default function SélecteurMultiple({ libellé, catégorieDeFiltre, filtres }: SélecteurMultipleProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');

  const changementDeLÉtatDuFiltreCallback = useCallback((estSélectionné: boolean, filtre: PérimètreMinistériel) => {
    return estSélectionné ? activerUnFiltre(filtre, catégorieDeFiltre) : désactiverUnFiltre(filtre.id, catégorieDeFiltre);
  }, [activerUnFiltre, désactiverUnFiltre, catégorieDeFiltre]);

  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValeurDeLaRecherche(event.target.value);
  }, [setValeurDeLaRecherche]);

  const filtresFiltrésAvecRecherche = useMemo(() =>{
    return filtres.filter(filtre => rechercheUnTexteContenuDansUnContenant(valeurDeLaRecherche, filtre.nom));
  }, [valeurDeLaRecherche, filtres]);

  const nombreFiltresActifCatégorie = actionsFiltresStore().récupérerNombreFiltresActifsDUneCatégorie(catégorieDeFiltre);

  return (
    <SélecteurMultipleStyled className="fr-form-group">
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn"
        type='button'
      >
        {nombreFiltresActifCatégorie > 0 ? `${libellé} (${nombreFiltresActifCatégorie})` : libellé}
      </button>
      <div
        className="fr-collapse fr-pt-1w fr-px-1w"
        id={`fr-sidemenu-item-${catégorieDeFiltre}`}
      >
        <BarreDeRecherche
          changementDeLaRechercheCallback={changementDeLaRechercheCallback}
          valeur={valeurDeLaRecherche}
        />
        <div
          aria-label={`Liste des filtres ${catégorieDeFiltre}`}
          className='choix-filtres'
          role='list'
        >
          {
            filtresFiltrésAvecRecherche.length > 0
              ?
              filtresFiltrésAvecRecherche.map((filtre) => {
                return (
                  <Fragment key={filtre.id}>
                    <div
                      className="fr-checkbox-group fr-py-3v"
                      role='listitem'
                    >
                      <input
                        checked={estActif(filtre.id, catégorieDeFiltre)}
                        id={`case-à-cocher-${catégorieDeFiltre}-${filtre.id}`}
                        name={`case-à-cocher-${catégorieDeFiltre}-${filtre.id}`}
                        onChange={événement => changementDeLÉtatDuFiltreCallback(événement.target.checked, filtre)}
                        type="checkbox"
                      />
                      <label
                        className="fr-label"
                        htmlFor={`case-à-cocher-${catégorieDeFiltre}-${filtre.id}`}
                      >
                        {filtre.nom}
                      </label>
                    </div>
                    <hr className='fr-hr flex fr-pb-1v fr-mx-1w' />
                  </Fragment>
                );
              })
              :
              'Aucun filtre ne correspond à votre recherche...'
          }
        </div>
      </div>
    </SélecteurMultipleStyled>
  );
}
