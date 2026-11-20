import { Controller } from "react-hook-form";
import { Button } from "@/components/shared/Button";
import { CheckboxField } from "@/components/shared/Checkbox";
import { FormTextField } from "@/components/shared/FormTextField";
import { Modale } from "@/components/shared/Modale";
import { Notice } from "@/components/shared/Notice";
import type {
  PeriodeInformation,
  PeriodesInformation,
} from "@/server/formations/queries/ListPeriodesInformationQuery";
import { formaterJour, listerPeriodes } from "./formaterPeriodes";
import { usePeriodeInformationForm } from "./usePeriodeInformationForm";

function avertissementRemplacement({
  periodesRemplacees,
  dateDebut,
  aujourdhui,
}: {
  periodesRemplacees: PeriodeInformation[];
  dateDebut: string;
  aujourdhui: string;
}): string {
  const periodes = listerPeriodes(
    periodesRemplacees.map((periode) => ({
      ...periode,
      precision: periode.statut === "EN_COURS" ? "en cours" : "à venir",
    })),
  );
  const remplacement =
    periodesRemplacees.length === 1
      ? `Cette période chevauche celle ${periodes}. À l'enregistrement, elle la remplace : l'ancienne sera supprimée.`
      : `Cette période chevauche celles ${periodes}. À l'enregistrement, elle les remplace : elles seront supprimées.`;
  const remplaceLaPeriodeEnCoursPlusTard =
    periodesRemplacees.some((periode) => periode.statut === "EN_COURS") &&
    dateDebut > aujourdhui;
  return remplaceLaPeriodeEnCoursPlusTard
    ? `${remplacement} Aucune période ne sera en cours avant le ${formaterJour(dateDebut)}.`
    : remplacement;
}

export const ModalePeriodeInformation = ({
  periode,
  donnees,
  onClose,
}: {
  periode: PeriodeInformation | null;
  donnees: PeriodesInformation;
  onClose: () => void;
}) => {
  const { reactHookForm, enregistrer, periodesRemplacees, aujourdhui } =
    usePeriodeInformationForm({
      periode,
      periodes: donnees.periodes,
      onClose,
    });
  const { control, watch } = reactHookForm;

  return (
    <Modale
      onOpenChange={(ouverte) => {
        if (!ouverte) onClose();
      }}
      open
      size="md"
      title={
        periode
          ? "Modifier la période d'information"
          : "Nouvelle période d'information"
      }
    >
      <form className="flex flex-col gap-6" noValidate onSubmit={enregistrer}>
        <div className="flex flex-wrap gap-6">
          <FormTextField
            control={control}
            label="Du"
            name="dateDebut"
            readOnly={periode?.statut === "EN_COURS"}
            type="date"
          />
          <FormTextField
            control={control}
            label="Au"
            name="dateFin"
            type="date"
          />
        </div>
        {periodesRemplacees.length > 0 ? (
          <Notice containerClassName="px-4" variant="warning">
            {avertissementRemplacement({
              periodesRemplacees,
              dateDebut: watch("dateDebut"),
              aujourdhui,
            })}
          </Notice>
        ) : null}
        <Controller
          control={control}
          name="motifIds"
          render={({ field, fieldState }) => (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-base text-dsfr-grey-50">
                Formations proposées
              </legend>
              {donnees.motifsDisponibles.map((motif) => (
                <CheckboxField
                  checked={field.value.includes(motif.id)}
                  hint={
                    motif.aDesSeancesAVenir
                      ? undefined
                      : "aucune séance à venir"
                  }
                  key={motif.id}
                  label={motif.nom}
                  onCheckedChange={(etat) =>
                    field.onChange(
                      etat === true
                        ? [...field.value, motif.id]
                        : field.value.filter((motifId) => motifId !== motif.id),
                    )
                  }
                />
              ))}
              {fieldState.error ? (
                <p className="text-sm text-dsfr-error-425">
                  {fieldState.error.message}
                </p>
              ) : null}
            </fieldset>
          )}
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
