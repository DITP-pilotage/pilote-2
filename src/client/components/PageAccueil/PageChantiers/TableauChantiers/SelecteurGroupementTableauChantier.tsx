import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";

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
        className="whitespace-nowrap py-2"
      >
        par chantier
      </SegmentedControl.Item>
      <SegmentedControl.Item
        value="ministere"
        className="whitespace-nowrap py-2"
      >
        par ministère
      </SegmentedControl.Item>
    </SegmentedControl.Root>
  );
};
