import React from 'react';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { horodatage } from '@/client/utils/date/date';
import api from '@/server/infrastructure/api/trpc/api';
import {
  getAnneeDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule';

const ressources = {
  'ppg': {
    id: 'chantiers' as const,
    baseDuNomDeFichier: 'PILOTE-Chantiers',
    url: '/api/export/chantiers-v2',
  },
  'indicateurs': {
    id: 'indicateurs' as const,
    baseDuNomDeFichier: 'PILOTE-Indicateurs',
    url: '/api/export/indicateurs-v2',
  },
};

export const EtapeRecapitulatif = () => {
  const [, setEtapeCourante] = useQueryState('etapeCourante', parseAsInteger.withOptions({
    shallow: true,
    history: 'push',
  }));

  const { data: dataBasculeValeurAnneePrecedente } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE' });

  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    meteos: parseAsString.withDefault(''),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
    statut: parseAsStringLiteral(['BROUILLON', 'PUBLIE', 'BROUILLON_ET_PUBLIE', 'ARCHIVE']).withDefault('PUBLIE'),
    jalon: parseAsStringLiteral(['2024', '2025']).withDefault(getAnneeDateDeBascule(new Date(), dataBasculeValeurAnneePrecedente as string).toString() as '2024' | '2025'),
    optionsExport: parseAsString.withDefault('identifiant'),
    isAvecFiltre: parseAsBoolean.withDefault(false),
    typeExport: parseAsStringLiteral(['ppg', 'indicateurs']).withDefault('ppg'),
  });

  const arrayOptionsExport: {
    name: string,
    value: string | boolean
  }[] = filtres.perimetres.split(',').filter(Boolean).map(filtrePerimetreMinisteriel => ({
    name: 'perimetreIds',
    value: filtrePerimetreMinisteriel,
  }));

  if (filtres.estBarometre) {
    arrayOptionsExport.push({ name: 'estBarometre', value: true });
  }

  filtres.optionsExport.split(',').filter(Boolean).forEach(filtreMeteo => {
    arrayOptionsExport.push({ name: 'optionsExport', value: filtreMeteo });
  });

  filtres.meteos.split(',').filter(Boolean).forEach(filtreMeteo => {
    arrayOptionsExport.push({ name: 'meteos', value: filtreMeteo });
  });

  if (filtres.estTerritorialise) {
    arrayOptionsExport.push({ name: 'estTerritorialise', value: true });
  }

  (filtres.statut === 'BROUILLON' ? ['PUBLIE'] : filtres.statut === 'BROUILLON_ET_PUBLIE' ? ['BROUILLON', 'PUBLIE'] : ['PUBLIE']).forEach(statut => {
    arrayOptionsExport.push({ name: 'statut', value: statut });
  });

  arrayOptionsExport.push({ name: 'jalon', value: filtres.jalon });

  return (
    <div>
      <form
        className='fr-mt-2w'
        data-testid='form-export'
        onSubmit={(événement) => {
          événement.preventDefault();
          const { url, baseDuNomDeFichier } = ressources[filtres.typeExport];
          if (url) {
            const a = window.document.createElement('a');
            const strOptionsExport = `${arrayOptionsExport.map(option => `${option.name}=${option.value}`).join('&')}`;
            a.href = `${url}${filtres.isAvecFiltre && arrayOptionsExport.length > 0 ? `?${strOptionsExport}` : ''}`;
            a.target = '_self';
            a.download = `${baseDuNomDeFichier}-${horodatage()}.csv`;
            document.body.append(a);
            a.click();
            a.remove();
          }
        }}
      >
        <div className='w-full flex justify-end fr-mt-2w'>
          <button
            className='fr-btn fr-mr-2w'
            onClick={() => setEtapeCourante(3)}
            type='button'
          >
            Étape précédente
          </button>
          <button
            className='fr-btn fr-btn--icon-left fr-icon-download-line btn-radius'
            type='submit'
          >
            Exporter les données
          </button>
        </div>
      </form>
    </div>
  );
};
