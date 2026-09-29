import { FunctionComponent } from "react";
import { Select } from "@/components/shared/Select";
import { SortButtons } from "@/components/shared/DataTable/SortButtons";
import {
  CRITERES_TRI_CHANTIERS,
  type CritereTriChantiers,
  TRI_CHANTIERS_PAR_DEFAUT,
} from "@/server/chantiers/app/contrats/TriChantiers";
import { LIBELLES_TRI_CHANTIERS } from "./libellesTriChantiers";
import type { ChantiersTable } from "./useTableauChantiers";

export const TableauChantiersActionsDeTri: FunctionComponent<{
  table: ChantiersTable;
}> = ({ table }) => {
  const [tri = TRI_CHANTIERS_PAR_DEFAUT] = table.store.state.sorting;
  const critère = tri.id as CritereTriChantiers;
  const trier = (id: string, desc: boolean) => table.setSorting([{ id, desc }]);

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-sm/6" htmlFor="tri-tableau-chantiers">
          Trier par
        </label>
        <Select.Root
          onValueChange={(critèreSélectionné) =>
            trier(critèreSélectionné, tri.desc)
          }
          value={critère}
        >
          <Select.Trigger className="w-64 text-left" id="tri-tableau-chantiers">
            <span className="line-clamp-1">
              <Select.Value />
            </span>
          </Select.Trigger>
          <Select.Content>
            {CRITERES_TRI_CHANTIERS.map((critèreProposé) => (
              <Select.Item key={critèreProposé} value={critèreProposé}>
                {LIBELLES_TRI_CHANTIERS[critèreProposé]}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>
      <div className="mb-2">
        <SortButtons
          direction={tri.desc ? "desc" : "asc"}
          label={LIBELLES_TRI_CHANTIERS[critère]}
          onChange={(direction) => trier(critère, direction === "desc")}
        />
      </div>
    </div>
  );
};
