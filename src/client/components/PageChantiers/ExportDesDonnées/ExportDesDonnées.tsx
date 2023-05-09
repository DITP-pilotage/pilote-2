import '@gouvfr/dsfr/dist/component/radio/radio.min.css';
import { ChangeEvent, useState } from 'react';
import Modale from '@/components/_commons/Modale/Modale';

const options = [
  {
    libellé: 'Les chantiers sans filtre',
    id: 'chantiers-sans-filtre',
    url: '/api/export/chantiers-sans-filtre',
  },
  {
    libellé: 'Les indicateurs sans filtre',
    id: 'indicateurs-sans-filtre',
    url: '/api/export/indicateurs-sans-filtre',
  },
];

export const ID_HTML_MODALE_EXPORT = 'modale-exporter-les-données';

export default function ExportDesDonnées() {
  const [valeur, setValeur] = useState<string | undefined>();

  const auChangementDeValeur = (événement: ChangeEvent) => {
    setValeur(événement.target.id);
  };

  return (
    <Modale
      idHtml={ID_HTML_MODALE_EXPORT}
      titre="Exporter les données"
    >
      <form
        className="fr-mt-2w"
        onSubmit={(événement) => {
          événement.preventDefault();
          const url = options.find(option => option.id === valeur)?.url ?? null;
          if (url) {
            window.open(url, '_self');
          }
        }}
      >
        <fieldset
          aria-labelledby="légende-données-à-exporter"
          className="fr-fieldset"
          id="données-à-exporter"
        >
          <legend
            className="fr-fieldset__legend--regular fr-fieldset__legend"
            id="légende-données-à-exporter"
          >
            Sélectionnez les données à exporter
            {' '}
            <span className="fr-hint-text">
              Les données exportées seront téléchargées au format .csv
            </span>
          </legend>
          {
            options.map(option => (
              <div
                className="fr-fieldset__element"
                key={option.id}
              >
                <div className="fr-radio-group">
                  <input
                    checked={valeur === option.id}
                    id={option.id}
                    name="données-à-exporter"
                    onChange={auChangementDeValeur}
                    type="radio"
                  />
                  <label
                    className="fr-label"
                    htmlFor={option.id}
                  >
                    { option.libellé }
                  </label>
                </div>
              </div>
            ))
          }
          <div className="fr-mt-2w flex">
            <button
              className="fr-btn fr-btn--icon-left fr-icon-download-line btn-radius"
              disabled={valeur === undefined}
              type="submit"
            >
              Exporter les données
            </button>
            <button
              aria-controls={ID_HTML_MODALE_EXPORT}
              className="fr-btn fr-btn--secondary fr-ml-4w btn-radius"
              type="button"
            >
              Annuler
            </button>
          </div>
        </fieldset>
      </form>
    </Modale>
  );
}
