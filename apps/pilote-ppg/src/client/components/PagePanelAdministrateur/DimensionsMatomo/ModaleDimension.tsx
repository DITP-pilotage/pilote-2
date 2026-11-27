import { Button } from "@/components/shared/Button";
import { FormTextField } from "@/components/shared/FormTextField";
import { Modale } from "@/components/shared/Modale";
import { useDimensionForm } from "./useDimensionForm";
import type { DimensionRow } from "./useTableauDimensions";

export const ModaleDimension = ({
  row,
  onClose,
}: {
  row: DimensionRow;
  onClose: () => void;
}) => {
  const { control, save } = useDimensionForm({ row, onClose });

  return (
    <Modale
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      size="sm"
      title={`Dimension ${row.dimension}`}
    >
      <form className="flex flex-col gap-6" noValidate onSubmit={save}>
        <FormTextField
          control={control}
          hint="Laissez vide pour retirer la dimension."
          inputMode="numeric"
          label="Numéro de la dimension dans Matomo"
          name="slot"
        />
        <div className="flex justify-end gap-4">
          <Button onClick={onClose} variant="secondary">
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            Enregistrer
          </Button>
        </div>
      </form>
    </Modale>
  );
};
