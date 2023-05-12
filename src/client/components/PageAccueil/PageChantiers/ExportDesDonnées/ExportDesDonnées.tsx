import '@gouvfr/dsfr/dist/component/radio/radio.min.css';
import { useState } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import { horodatage } from '@/client/utils/date/date';

const ressources = {
  'chantiers-sans-filtre': {
    libellé: 'Les chantiers sans filtre',
    id: 'chantiers-sans-filtre' as const,
    baseDuNomDeFichier: 'PILOTE-Chantiers-sans-filtre',
    url: '/api/export/chantiers-sans-filtre',
  },
  'indicateurs-sans-filtre': {
    libellé: 'Les indicateurs sans filtre',
    id: 'indicateurs-sans-filtre' as const,
    baseDuNomDeFichier: 'PILOTE-Indicateurs-sans-filtre',
    url: '/api/export/indicateurs-sans-filtre',
  },
};

export const ID_HTML_MODALE_EXPORT = 'modale-exporter-les-données';

export default function ExportDesDonnées() {
  const [ressourceÀExporter, setRessourceÀExporter] = useState<keyof typeof ressources | undefined>();

  return (
    <Modale
      idHtml={ID_HTML_MODALE_EXPORT}
      titre="Exporter les données"
    >
      <form
        className="fr-mt-2w"
        onSubmit={(événement) => {
          événement.preventDefault();
          if (!ressourceÀExporter)
            return;

          const { url, baseDuNomDeFichier } = ressources[ressourceÀExporter];
          if (url) {
            const a = window.document.createElement('a');
            a.href = url;
            a.target = '_self';
            a.download = `${baseDuNomDeFichier}-${horodatage()}.csv`;
            document.body.append(a);
            a.click();
            a.remove();
          }
        }}
      >
        <fieldset
          aria-labelledby="légende-ressource-à-exporter"
          className="fr-fieldset"
          id="ressource-à-exporter"
        >
          <legend
            className="fr-fieldset__legend--regular fr-fieldset__legend"
            id="légende-ressource-à-exporter"
          >
            Sélectionnez les données à exporter&nbsp;:
            {' '}
            <span className="fr-hint-text">
              Les données exportées seront téléchargées au format .csv
            </span>
          </legend>
          {
            Object.values(ressources).map((ressource) => (
              <div
                className="fr-fieldset__element"
                key={ressource.id}
              >
                <div className="fr-radio-group">
                  <input
                    checked={ressourceÀExporter === ressource.id}
                    id={ressource.id}
                    name="ressource-à-exporter"
                    onChange={() => setRessourceÀExporter(ressource.id)}
                    type="radio"
                  />
                  <label
                    className="fr-label"
                    htmlFor={ressource.id}
                  >
                    { ressource.libellé }
                  </label>
                </div>
              </div>
            ))
          }
        </fieldset>
        <ul
          className="fr-btns-group fr-btns-group--left fr-btns-group--inline-sm fr-btns-group--icon-left"
        >
          <li>
            <button
              className="fr-btn fr-btn--icon-left fr-icon-download-line btn-radius"
              disabled={ressourceÀExporter === undefined}
              type="submit"
            >
              Exporter les données
            </button>
          </li>
          <li>
            <button
              aria-controls={ID_HTML_MODALE_EXPORT}
              className="fr-btn fr-btn--secondary btn-radius"
              type="button"
            >
              Annuler
            </button>
          </li>
        </ul>
      </form>
    </Modale>
  );
}
