import { Fragment, FunctionComponent, useState } from "react";
import { $Enums } from "@prisma/client";
import { useTableauLogs } from "./useTableauLogs";
import { ModalePurge } from "./ModalePurge";

const CATEGORIES = [
  "auth",
  "import",
  "pva",
  "rapport",
  "api",
  "indicateur",
  "utilisateur",
  "systeme",
];

const BADGE_CLASSES: Record<$Enums.log_level, string> = {
  ERROR: "fr-badge fr-badge--error fr-badge--no-icon fr-badge--sm",
  WARN: "fr-badge fr-badge--warning fr-badge--no-icon fr-badge--sm",
  INFO: "fr-badge fr-badge--info fr-badge--no-icon fr-badge--sm",
  DEBUG: "fr-badge fr-badge--new fr-badge--no-icon fr-badge--sm",
};

function formaterDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export const TableauLogs: FunctionComponent = () => {
  const {
    logs,
    total,
    isLoading,
    page,
    setPage,
    totalPages,
    filtreLevel,
    setFiltreLevel,
    filtreCategorie,
    setFiltreCategorie,
    filtreRecherche,
    setFiltreRecherche,
    dateDebut,
    setDateDebut,
    logExpanduId,
    toggleExpansion,
  } = useTableauLogs();

  const [modalePurgeOuverte, setModalePurgeOuverte] = useState(false);

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-3">
          <label
            className="fr-label"
            htmlFor="filtre-level"
          >
            Niveau
          </label>
          <select
            className="fr-select"
            id="filtre-level"
            onChange={(event) =>
              setFiltreLevel(
                (event.target.value as $Enums.log_level) || undefined,
              )
            }
            value={filtreLevel ?? ""}
          >
            <option value="">Tous</option>
            {Object.values($Enums.log_level).map((level) => (
              <option
                key={level}
                value={level}
              >
                {level}
              </option>
            ))}
          </select>
        </div>
        <div className="fr-col-3">
          <label
            className="fr-label"
            htmlFor="filtre-categorie"
          >
            Catégorie
          </label>
          <select
            className="fr-select"
            id="filtre-categorie"
            onChange={(event) =>
              setFiltreCategorie(event.target.value || undefined)
            }
            value={filtreCategorie ?? ""}
          >
            <option value="">Toutes</option>
            {CATEGORIES.map((cat) => (
              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="fr-col-3">
          <label
            className="fr-label"
            htmlFor="filtre-date-debut"
          >
            Date début
          </label>
          <input
            className="fr-input"
            id="filtre-date-debut"
            onChange={(event) =>
              setDateDebut(
                event.target.value
                  ? new Date(event.target.value).toISOString()
                  : undefined,
              )
            }
            type="date"
            value={dateDebut ? dateDebut.slice(0, 10) : ""}
          />
        </div>
        <div className="fr-col-3">
          <label
            className="fr-label"
            htmlFor="filtre-recherche"
          >
            Recherche
          </label>
          <input
            className="fr-input"
            id="filtre-recherche"
            onChange={(event) =>
              setFiltreRecherche(event.target.value || undefined)
            }
            placeholder="Rechercher dans les messages..."
            type="text"
            value={filtreRecherche ?? ""}
          />
        </div>
      </div>

      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className="fr-table">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Niveau</th>
                  <th>Catégorie</th>
                  <th>Message</th>
                  <th>Source</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr>
                      <td
                        style={{
                          fontFamily: "monospace",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formaterDate(log.timestamp)}
                      </td>
                      <td>
                        <span className={BADGE_CLASSES[log.level]}>
                          {log.level}
                        </span>
                      </td>
                      <td>{log.categorie}</td>
                      <td
                        style={{
                          maxWidth: "400px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.message}
                      </td>
                      <td
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.85em",
                        }}
                      >
                        {log.source}
                      </td>
                      <td>
                        {log.contexte && (
                          <button
                            className="fr-btn fr-btn--sm fr-btn--tertiary-no-outline"
                            onClick={() => toggleExpansion(log.id)}
                            type="button"
                          >
                            {logExpanduId === log.id ? "▼" : "▶"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {logExpanduId === log.id && log.contexte && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            background: "#1e1e2e",
                            padding: "1rem",
                          }}
                        >
                          <pre
                            style={{
                              color: "#cdd6f4",
                              fontFamily: "monospace",
                              fontSize: "0.85em",
                              margin: 0,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {JSON.stringify(log.contexte, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="fr-grid-row fr-grid-row--middle fr-mt-2w">
            <div className="fr-col">
              <p className="fr-text--sm fr-mb-0">
                {total} logs — Page {page} / {totalPages}
              </p>
            </div>
            <div className="fr-col-auto">
              <nav
                aria-label="Pagination"
                className="fr-pagination"
                role="navigation"
              >
                <ul className="fr-pagination__list">
                  <li>
                    <button
                      className="fr-pagination__link fr-pagination__link--prev"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      type="button"
                    >
                      Précédent
                    </button>
                  </li>
                  <li>
                    <button
                      className="fr-pagination__link fr-pagination__link--next"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      type="button"
                    >
                      Suivant
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
            <div className="fr-col-auto">
              <button
                className="fr-btn fr-btn--secondary"
                onClick={() => setModalePurgeOuverte(true)}
                type="button"
              >
                Purger les logs
              </button>
            </div>
          </div>
        </>
      )}

      {modalePurgeOuverte && (
        <ModalePurge onFermer={() => setModalePurgeOuverte(false)} />
      )}
    </div>
  );
};
