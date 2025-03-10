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
  'historique-indicateurs': {
    id: 'historique-indicateurs' as const,
    baseDuNomDeFichier: 'PILOTE-Historique-Indicateurs',
    url: '/api/export/historique-indicateurs',
  },
};

const chantierDonneesExportable = {
  'identifiant': 'identifiants de la PPG et du territoire',
  'gouvernance': 'gouvernance de la PPG',
  'responsabilite': 'responsabilité de la PPG',
  'objectif': 'objectifs de la PPG',
  'description': 'données descriptives de la PPG sur le territoire',
  'comparaison': 'données de comparaison de la PPG',
  'synthese': 'météo et synthèse des résultats de la PPG sur le territoire',
  'commentaire': 'commentaires de la PPG',
  'decision': 'suivi des décisions stratégiques de la PPG',
};

const indicateurDonneesExportable = {
  'identifiant': 'identifiants de l\'indicateur, de la PPG associée et du territoire',
  'cadrage': 'cadrage de l\'indicateur',
  'gouvernance': 'gouvernance de l\'indicateur et de la PPG associée',
  'responsabilite': 'responsabilités de l\'indicateur et de la PPG associée',
  'objectif': 'objectifs de la PPG associée : notre ambition, ce qui a déjà été fait, ce qui reste à faire',
  'description': 'données descriptives de l\'indicateur et de la PPG associée sur le territoire',
  'comparaison': 'données de comparaison de l\'indicateur',
  'synthese': 'météo et synthèse des résultats de la PPG associée sur le territoire',
  'commentaire': 'commentaires de la PPG associée',
  'decision': 'suivi des décisions stratégiques de la PPG associée',
};

const historiqueIndicateurDonneesExportable = {
  'identifiant': 'identifiants de l\'indicateur et du territoire',
  'valeur-cible': 'valeur initiale et valeurs cibles de l\'indicateur sur le territoire les valeurs cibles sont exportées pour l\'année en cours et pour l\'année 2026',
  'valeur-actuelle': 'valeurs actuelles de l\'indicateur sur le territoire, mois par mois',
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
    typeExport: parseAsStringLiteral(['ppg', 'indicateurs', 'historique-indicateurs']).withDefault('ppg'),
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

  const arrayDonneeAExporter = filtres.typeExport === 'ppg' ? chantierDonneesExportable : filtres.typeExport === 'indicateurs' ? indicateurDonneesExportable : historiqueIndicateurDonneesExportable;

  return (
    <div>
      <p className='fr-mt-2w fr-mb-2w'>
        Veuillez vérifier ci-dessous le contenu de votre fichier d'export :
      </p>
      <h3 className='fr-text--md fr-mb-0 fr-mt-2w'>
        Contenus à exporter
      </h3>
      <p>
        <span
          aria-hidden='true'
          className='fr-icon-check-line texte-success fr-mr-1w'
        />
        {
          filtres.typeExport === 'ppg' ? (
            <span>
              PPG
            </span>
          ) : filtres.typeExport === 'indicateurs' ? (
            <span>
              Indicateurs
            </span>
          ) : (
            <span>
              Historique indicateurs
            </span>
          )
        }
      </p>
      <h3 className='fr-text--md fr-mb-0 fr-mt-2w'>
        Périmètre de l'export
      </h3>
      <p>
        <span
          aria-hidden='true'
          className='fr-icon-check-line texte-success fr-mr-1w'
        />
        {
          filtres.isAvecFiltre ? (
            <span>
              exporter les contenus de la sélection présentement active dans PILOTE
            </span>
          ) : (
            <span>
              exporter tous les contenus sur tous les territoires qui vous sont ouverts en lecture
            </span>
          )
        }
      </p>
      <h3 className='fr-text--md fr-mb-0 fr-mt-2w'>
        Données collectées
      </h3>
      <ul className='list-style-none fr-pl-0'>
        {
          Object.entries(arrayDonneeAExporter).filter(([key]) => filtres.optionsExport.includes(key)).map(([key, value]) => {
            return (
              <li key={key}>
                <span
                  aria-hidden='true'
                  className='fr-icon-check-line texte-success fr-mr-1w'
                />
                {value}
              </li>
            );
          })
        }
      </ul>
      <form
        className='fr-mt-2w'
        data-testid='form-export'
        onSubmit={(événement) => {
          événement.preventDefault();
          const { url, baseDuNomDeFichier } = ressources[filtres.typeExport];
          if (url) {
            const a = window.document.createElement('a');
            const strOptionsExport = `${arrayOptionsExport.map(option => `${option.name}=${option.value}`).join('&')}`;
            a.href = `${url}?${filtres.optionsExport.split(',').filter(Boolean).map(option => `optionsExport=${option}`).join('&')}${filtres.isAvecFiltre && arrayOptionsExport.length > 0 ? `&${strOptionsExport}` : ''}`;
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
