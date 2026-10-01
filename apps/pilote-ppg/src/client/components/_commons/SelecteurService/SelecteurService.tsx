import {
  SelectField,
  type SelectFieldOptionGroup,
} from "@/components/shared/SelectField";
import { referentielServices } from "@/utils/referentiel-services";
import {
  buildCompositeValue,
  parseCompositeValue,
  buildCompositeSelectedValue,
} from "@/components/_commons/SelecteurService/composite-value";

const groupedOptions: SelectFieldOptionGroup<string>[] =
  referentielServices.perimetresMinisteriels.map((perimetre) => ({
    libelle: perimetre.libelle,
    valeur: perimetre.slug,
    options: perimetre.services.map((service) => ({
      libelle: service.libelle,
      valeur: buildCompositeValue(perimetre.slug, service.slug),
    })),
  }));

export const SelecteurService = ({
  service,
  perimetreMinisteriel,
  erreurMessage,
  isRequired = false,
  onChange,
}: {
  service: string | null;
  perimetreMinisteriel: string | null;
  erreurMessage?: string;
  isRequired?: boolean;
  onChange: (selection: {
    service: string;
    perimetreMinisteriel: string;
  }) => void;
}) => (
  <SelectField
    name="service"
    label="Service"
    className="fr-input-group"
    triggerClassName="w-full"
    searchPlaceholder="Rechercher un service ou un périmètre ministériel"
    options={groupedOptions}
    required={isRequired}
    value={buildCompositeSelectedValue(perimetreMinisteriel, service)}
    errorMessage={erreurMessage}
    placeholder="Sélectionner..."
    onChange={(compositeSlug, group) =>
      onChange({
        service: parseCompositeValue(compositeSlug),
        perimetreMinisteriel: group?.valeur ?? "",
      })
    }
  />
);
