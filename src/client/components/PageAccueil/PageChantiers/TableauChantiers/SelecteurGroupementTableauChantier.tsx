import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { Icone } from "@/components/_commons/Icone";
import { BuildingLineIcon } from "@/components/_commons/Icones/BuildingLineIcon";
import { ListUnorderedIcon } from "@/components/_commons/Icones/ListUnorderedIcon";

export const SelecteurGroupementTableauChantier = () => {
  const [estGroupe, setEstGroupe] = useQueryState(
    "groupeParMinistere",
    parseAsBoolean.withDefault(false).withOptions({
      clearOnDefault: true,
    }),
  );

  const [, setPagination] = useQueryState(
    "pageIndex",
    parseAsInteger.withDefault(1).withOptions({
      shallow: false,
    }),
  );

  return (
    <SegmentedControl.Root
      onValueChange={async (value) => {
        if (!value) return;
        const grouper = value === "ministere";
        sauvegarderFiltres({ groupeParMinistere: grouper });
        setPagination(1);
        await setEstGroupe(grouper);
      }}
      type="single"
      value={estGroupe ? "ministere" : "chantier"}
    >
      <SegmentedControl.Item
        value="chantier"
        className="whitespace-nowrap flex py-2 items-center gap-2"
      >
        <Icone icone={ListUnorderedIcon} className="text-current" />
        <span className="hidden md:block">Vue par chantier</span>
      </SegmentedControl.Item>
      <SegmentedControl.Item
        value="ministere"
        className="whitespace-nowrap py-2 flex items-center gap-2"
      >
        <Icone icone={BuildingLineIcon} className="text-current" />
        <span className="hidden md:block">Vue par ministère</span>
      </SegmentedControl.Item>
    </SegmentedControl.Root>
  );
};
