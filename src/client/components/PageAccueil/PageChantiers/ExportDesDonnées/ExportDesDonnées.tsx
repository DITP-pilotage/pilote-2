import '@gouvfr/dsfr/dist/component/radio/radio.min.css';
import { FunctionComponent, useState } from 'react';
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import Modale from '@/components/_commons/Modale/Modale';
import { horodatage } from '@/client/utils/date/date';

const ressources = {
  'chantiers-sans-filtre': {
    libellé: 'Les politiques prioritaires sans filtre',
    id: 'chantiers-sans-filtre' as const,
    baseDuNomDeFichier: 'PILOTE-PPG-sans-filtre',
    url: '/api/export/chantiers',
    options: false,
  },
  'chantiers-avec-filtre': {
    libellé: 'Les politiques prioritaires avec filtre',
    id: 'chantiers-avec-filtre' as const,
    baseDuNomDeFichier: 'PILOTE-PPG-avec-filtre',
    url: '/api/export/chantiers',
    options: true,
  },
  'indicateurs-sans-filtre': {
    libellé: 'Les indicateurs sans filtre',
    id: 'indicateurs-sans-filtre' as const,
    baseDuNomDeFichier: 'PILOTE-Indicateurs-sans-filtre',
    url: '/api/export/indicateurs',
    options: false,
  },
  'indicateurs-avec-filtre': {
    libellé: 'Les indicateurs avec filtre',
    id: 'indicateurs-avec-filtre' as const,
    baseDuNomDeFichier: 'PILOTE-Indicateurs-avec-filtre',
    url: '/api/export/indicateurs',
    options: true,
  },
};

export const ID_HTML_MODALE_EXPORT = 'modale-exporter-les-données';

const ExportDesDonnées: FunctionComponent<{}> = () => {
  const [ressourceÀExporter, setRessourceÀExporter] = useState<keyof typeof ressources | undefined>();
  const [estDésactivé, setEstDésactivé] = useState(false);

  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
    statut: parseAsStringLiteral(['BROUILLON', 'PUBLIE', 'BROUILLON_ET_PUBLIE']).withDefault('PUBLIE'),
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

  if (filtres.estTerritorialise) {
    arrayOptionsExport.push({ name: 'estTerritorialise', value: true });
  }

  (filtres.statut === 'BROUILLON' ? ['PUBLIE'] : filtres.statut === 'BROUILLON_ET_PUBLIE' ? ['BROUILLON', 'PUBLIE'] : ['PUBLIE']).forEach(statut => {
    arrayOptionsExport.push({ name: 'statut', value: statut });
  });


  return (
    <Modale
      idHtml={ID_HTML_MODALE_EXPORT}
      ouvertureCallback={() => {
        setEstDésactivé(false);
      }}
      titre='Exporter les données'
    >
      <form
        className='fr-mt-2w'
        onChange={() => {
          setEstDésactivé(false);
        }}
        onSubmit={(événement) => {
          événement.preventDefault();
          if (!ressourceÀExporter)
            return;

          const { url, baseDuNomDeFichier, options } = ressources[ressourceÀExporter];
          if (url) {
            setEstDésactivé(true);
            const a = window.document.createElement('a');
            const strOptionsExport = `${arrayOptionsExport.map(option => `${option.name}=${option.value}`).join('&')}`;
            a.href = `${url}${options && arrayOptionsExport.length > 0 ? `?${strOptionsExport}` : ''}`;
            a.target = '_self';
            a.download = `${baseDuNomDeFichier}-${horodatage()}.csv`;
            document.body.append(a);
            a.click();
            a.remove();
          }
        }}
      >
        <fieldset
          aria-labelledby='légende-ressource-à-exporter'
          className='fr-fieldset'
          id='ressource-à-exporter'
        >
          <legend
            className='fr-fieldset__legend--regular fr-fieldset__legend'
            id='légende-ressource-à-exporter'
          >
            Sélectionnez les données à exporter&nbsp;:
            {' '}
            <span className='fr-hint-text'>
              Les données exportées seront téléchargées au format .csv
            </span>
          </legend>
          {
            Object.values(ressources).map((ressource) => (
              <div
                className='fr-fieldset__element'
                key={ressource.id}
              >
                <div className='fr-radio-group'>
                  <input
                    checked={ressourceÀExporter === ressource.id}
                    id={ressource.id}
                    name='ressource-à-exporter'
                    onChange={() => setRessourceÀExporter(ressource.id)}
                    type='radio'
                  />
                  <label
                    className='fr-label'
                    htmlFor={ressource.id}
                  >
                    {ressource.libellé}
                  </label>
                </div>
              </div>
            ))
          }
        </fieldset>
        <ul
          className='fr-btns-group fr-btns-group--left fr-btns-group--inline-sm fr-btns-group--icon-left'
        >
          <li>
            <button
              className='fr-btn fr-btn--icon-left fr-icon-download-line btn-radius'
              disabled={(ressourceÀExporter === undefined) || estDésactivé}
              type='submit'
            >
              Exporter les données
            </button>
          </li>
          <li>
            <button
              aria-controls={ID_HTML_MODALE_EXPORT}
              className='fr-btn fr-btn--secondary btn-radius'
              type='button'
            >
              Annuler
            </button>
          </li>
        </ul>
      </form>
    </Modale>
  );
};

export default ExportDesDonnées;
