import { FunctionComponent, useState } from "react";
import { TableauLogs } from "./TableauLogs";
import { GraphesLogs } from "./GraphesLogs";

export const PagePanelAdministrateurLogs: FunctionComponent = () => {
  const [ongletActif, setOngletActif] = useState<"tableau" | "graphes">(
    "tableau",
  );

  return (
    <div className="fr-tabs">
      <ul
        className="fr-tabs__list"
        role="tablist"
      >
        <li role="presentation">
          <button
            aria-controls="panel-tableau"
            aria-selected={ongletActif === "tableau"}
            className={`fr-tabs__tab ${ongletActif === "tableau" ? "fr-tabs__tab--active" : ""}`}
            id="tab-tableau"
            onClick={() => setOngletActif("tableau")}
            role="tab"
            type="button"
          >
            Tableau des logs
          </button>
        </li>
        <li role="presentation">
          <button
            aria-controls="panel-graphes"
            aria-selected={ongletActif === "graphes"}
            className={`fr-tabs__tab ${ongletActif === "graphes" ? "fr-tabs__tab--active" : ""}`}
            id="tab-graphes"
            onClick={() => setOngletActif("graphes")}
            role="tab"
            type="button"
          >
            Graphes
          </button>
        </li>
      </ul>
      <div
        aria-labelledby="tab-tableau"
        className={`fr-tabs__panel ${ongletActif === "tableau" ? "fr-tabs__panel--selected" : ""}`}
        id="panel-tableau"
        role="tabpanel"
      >
        {ongletActif === "tableau" && <TableauLogs />}
      </div>
      <div
        aria-labelledby="tab-graphes"
        className={`fr-tabs__panel ${ongletActif === "graphes" ? "fr-tabs__panel--selected" : ""}`}
        id="panel-graphes"
        role="tabpanel"
      >
        {ongletActif === "graphes" && <GraphesLogs />}
      </div>
    </div>
  );
};
