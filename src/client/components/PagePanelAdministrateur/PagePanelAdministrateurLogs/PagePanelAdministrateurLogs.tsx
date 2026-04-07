import { FunctionComponent, Suspense, useState } from "react";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { TableauLogs } from "./TableauLogs";
import { GraphesLogs } from "./GraphesLogs";

export const PagePanelAdministrateurLogs: FunctionComponent = () => {
  const [ongletActif, setOngletActif] = useState("tableau");

  return (
    <div>
      <SegmentedControl.Root
        onValueChange={(value) => {
          if (value) setOngletActif(value);
        }}
        type="single"
        value={ongletActif}
      >
        <SegmentedControl.Item value="tableau">
          Tableau des logs
        </SegmentedControl.Item>
        <SegmentedControl.Item value="graphes">Graphes</SegmentedControl.Item>
      </SegmentedControl.Root>

      <div className="mt-6">
        <Suspense fallback={<p className="text-gray-500">Chargement...</p>}>
          {ongletActif === "tableau" && <TableauLogs />}
          {ongletActif === "graphes" && <GraphesLogs />}
        </Suspense>
      </div>
    </div>
  );
};
