import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';

import { FunctionComponent } from 'react';
import {
  actions as actionsFiltresModifierIndicateursStore, filtresModifierIndicateursActifsStore,
} from '@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import MultiSelectChantier from '@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier';
import api from '@/server/infrastructure/api/trpc/api';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import MultiSelectPérimètreMinistériel from '@/client/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel';
import Interrupteur from '@/client/components/_commons/Interrupteur/Interrupteur';
import Tag from '@/client/components/_commons/Tag/Tag';
import Titre from '@/client/components/_commons/Titre/Titre';

interface AdminIndicateursBarreLatéraleProps {
  estOuverteBarreLatérale: boolean,
  setEstOuverteBarreLatérale: (valeur: boolean) => void
}

const AdminIndicateurBarreLatérale: FunctionComponent<AdminIndicateursBarreLatéraleProps> = ({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
}) => {
  const { sauvegarderFiltres, réinitialiser } = actionsFiltresModifierIndicateursStore();
  const filtresActifs = filtresModifierIndicateursActifsStore();

  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: périmètresMinistériels } = api.périmètreMinistériel.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  
  const chantierAAfficher = filtresActifs.perimetresMinisteriels.length > 0  
    ? chantiers?.filter(chantier => chantier.périmètreIds.some(element => filtresActifs.perimetresMinisteriels.includes(element)))
    : chantiers;

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <div className='fr-mb-2w'>
          <MultiSelectPérimètreMinistériel
            changementValeursSélectionnéesCallback={(perimetresMinisteriel) => {
              sauvegarderFiltres({ 'perimetresMinisteriels': perimetresMinisteriel });
            }}
            périmètresMinistérielsIdsSélectionnésParDéfaut={filtresActifs.perimetresMinisteriels}
          />
        </div>
        <div className='fr-mb-2w'>
          <MultiSelectChantier
            changementValeursSélectionnéesCallback={(chantier) => {
              sauvegarderFiltres({ 'chantiers': chantier });
            }}
            chantiers={chantierAAfficher ?? []}
            chantiersIdsSélectionnésParDéfaut={filtresActifs.chantiers}
          />
        </div>
        <Interrupteur
          auChangement={(estTerritorialise) => {
            sauvegarderFiltres({ 'estTerritorialise': estTerritorialise });
          }}
          checked={filtresActifs.estTerritorialise}
          id='estTerritorialise'
          libellé='Indicateurs territorialisés'
        />
        <Interrupteur
          auChangement={(estBarometre) => {
            sauvegarderFiltres({ 'estBarometre': estBarometre });
          }}
          checked={filtresActifs.estBarometre}
          id='estBarometre'
          libellé='Indicateurs du baromètre'
        />
      </BarreLatéraleEncart>
      <div className='fr-px-3w fr-py-2w'>
        <Titre
          baliseHtml='h2'
          className='fr-h4'
        >
          Filtres actifs
        </Titre>
        <button
          className='fr-btn fr-btn--secondary'
          onClick={réinitialiser}
          type='button'
        >
          Réinitialiser les filtres
        </button>
        <button
          aria-controls='fr-sidemenu-item-perimetres'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-m-0'
          type='button'
        >
          Périmètre(s) ministériel(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-perimetres'
        >
          {
            filtresActifs.perimetresMinisteriels.map(perimetreId => {
              const label = périmètresMinistériels?.find(périmètre => périmètre.id === perimetreId)?.nom ?? null;
              return label === null ? null : (
                <Tag
                  key={perimetreId}
                  libellé={label}
                  suppressionCallback={() => {
                    const filtresApresSuppression = filtresActifs.perimetresMinisteriels.toSpliced(filtresActifs.perimetresMinisteriels.indexOf(perimetreId), 1);
                    sauvegarderFiltres({ 'perimetresMinisteriels': filtresApresSuppression });
                  }}
                />
              );
            })
          }
        </div>
        <button
          aria-controls='fr-sidemenu-item-chantiers'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-m-0'
          type='button'
        >
          Chantier(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-chantiers'
        >
          {
            filtresActifs.chantiers.map(chantierId => {
              const label = chantiers?.find(chantier => chantier.id === chantierId)?.nom ?? null;
              return label === null ? null : (
                <Tag
                  key={chantierId}
                  libellé={label}
                  suppressionCallback={() => {
                    const filtresApresSuppression = filtresActifs.chantiers.toSpliced(filtresActifs.chantiers.indexOf(chantierId), 1);
                    sauvegarderFiltres({ 'chantiers': filtresApresSuppression });
                  }}
                />
              );
            })
          }
        </div>
        <button
          aria-controls='fr-sidemenu-item-autres-filtres'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-m-0'
          type='button'
        >
          Autre(s) filtre(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-autres-filtres'
        >
          {
            !!filtresActifs.estTerritorialise && 
              <Tag
                key='estTerritorialise'
                libellé='Indicateurs territorialisés'
                suppressionCallback={() => {
                  sauvegarderFiltres({ 'estTerritorialise': false });
                }}
              />
          }
          {
            !!filtresActifs.estBarometre && 
              <Tag
                key='estBarometre'
                libellé='Indicateurs du baromètre'
                suppressionCallback={() => {
                  sauvegarderFiltres({ 'estBarometre': false });
                }}
              />
          }
        </div>
      </div>
    </BarreLatérale>
  );
};

export default AdminIndicateurBarreLatérale;
