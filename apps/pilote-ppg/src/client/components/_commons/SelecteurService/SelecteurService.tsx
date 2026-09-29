import {
  SelecteurNew,
  SelecteurNewOptionGroup,
} from "@/components/_commons/SelecteurNew/SelecteurNew";
import { referentielServices } from "@/utils/referentiel-services";
import {
  buildCompositeValue,
  parseCompositeValue,
  buildCompositeSelectedValue,
} from "@/components/_commons/SelecteurNew/composite-value";

const groupedOptions: SelecteurNewOptionGroup<string>[] =
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
  <SelecteurNew
    htmlName="service"
    libelle="Service"
    className="fr-input-group"
    triggerClassName="w-full"
    placeholderRecherche="Rechercher un service ou un périmètre ministériel"
    options={groupedOptions}
    isRequired={isRequired}
    valeurSelectionnee={buildCompositeSelectedValue(
      perimetreMinisteriel,
      service,
    )}
    erreurMessage={erreurMessage}
    placeholder="Sélectionner..."
    onChange={(compositeSlug, group) =>
      onChange({
        service: parseCompositeValue(compositeSlug),
        perimetreMinisteriel: group?.valeur ?? "",
      })
    }
  />
);
