import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { Button } from "@/components/shared/Button";
import { CheckboxField } from "@/components/shared/Checkbox";
import { Modale } from "@/components/shared/Modale";
import { Notice } from "@/components/shared/Notice";
import { TextField } from "@/components/shared/TextField";
import {
  validerPeriode,
  type ErreursPeriode,
} from "@/server/formations/domain/periodeInformation";
import type {
  PeriodeInformation,
  PeriodesInformation,
} from "@/server/formations/queries/ListPeriodesInformationQuery";

const TOAST_OPTIONS = {
  duration: 3000,
  position: "top-right",
  richColors: true,
} as const;

export const ModalePeriodeInformation = ({
  periode,
  donnees,
  onClose,
}: {
  periode: PeriodeInformation | null;
  donnees: PeriodesInformation;
  onClose: () => void;
}) => {
  const utils = api.useUtils();
  const [dateDebut, setDateDebut] = useState(periode?.dateDebut ?? "");
  const [dateFin, setDateFin] = useState(periode?.dateFin ?? "");
  const [motifIds, setMotifIds] = useState<number[]>(
    periode?.motifs
      .map((motif) => motif.id)
      .filter((motifId) =>
        donnees.motifsDisponibles.some((motif) => motif.id === motifId),
      ) ?? [],
  );
  const [erreurs, setErreurs] = useState<ErreursPeriode>({});
  const formationsRetirees =
    periode?.motifs.filter((motif) => motif.retireeDeRdvSp) ?? [];

  const savePeriode = api.formation.savePeriodeInformation.useMutation({
    onSuccess: async () => {
      await utils.formation.periodesInformation.invalidate();
      toast.success("Période enregistrée.", TOAST_OPTIONS);
      onClose();
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });

  const basculerMotif = (motifId: number, coche: boolean) =>
    setMotifIds((actuels) =>
      coche
        ? [...actuels, motifId]
        : actuels.filter((actuel) => actuel !== motifId),
    );

  const enregistrer = () => {
    if (savePeriode.isPending) return;
    const erreursSaisie = validerPeriode({
      saisie: { dateDebut, dateFin, motifIds },
      periodeModifiee: periode,
      autresPeriodes: donnees.periodes.filter(
        (autre) => autre.id !== periode?.id,
      ),
      aujourdhui: donnees.aujourdhui,
    });
    setErreurs(erreursSaisie);
    if (Object.keys(erreursSaisie).length > 0) return;
    savePeriode.mutate({
      id: periode?.id ?? null,
      dateDebut,
      dateFin,
      motifIds,
      csrf: récupérerUnCookie("csrf") ?? "",
    });
  };

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
      <div className="flex flex-col gap-6">
        {erreurs.periode ? (
          <Notice containerClassName="px-4" variant="warning">
            {erreurs.periode}
          </Notice>
        ) : null}
        <div className="flex flex-wrap gap-6">
          <TextField
            errorMessage={erreurs.dateDebut}
            label="Du"
            onChange={(event) => setDateDebut(event.target.value)}
            readOnly={periode?.statut === "EN_COURS"}
            type="date"
            value={dateDebut}
          />
          <TextField
            errorMessage={erreurs.dateFin}
            label="Au"
            onChange={(event) => setDateFin(event.target.value)}
            type="date"
            value={dateFin}
          />
        </div>
        {formationsRetirees.length > 0 ? (
          <Notice containerClassName="px-4" variant="warning">
            Retirées de RDV-SP, ces formations seront enlevées de la période à
            l'enregistrement :{" "}
            {formationsRetirees
              .map((motif) => motif.nom ?? "Formation inconnue")
              .join(", ")}
            .
          </Notice>
        ) : null}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-base text-dsfr-grey-50">
            Formations proposées
          </legend>
          {donnees.motifsDisponibles.map((motif) => (
            <CheckboxField
              checked={motifIds.includes(motif.id)}
              hint={
                motif.aDesSeancesAVenir ? undefined : "aucune séance à venir"
              }
              key={motif.id}
              label={motif.nom}
              onCheckedChange={(etat) => basculerMotif(motif.id, etat === true)}
            />
          ))}
          {erreurs.motifIds ? (
            <p className="text-sm text-dsfr-error-425">{erreurs.motifIds}</p>
          ) : null}
        </fieldset>
        <div className="flex justify-end gap-4">
          <Button onClick={onClose} variant="secondary">
            Annuler
          </Button>
          <Button onClick={enregistrer} variant="primary">
            Enregistrer
          </Button>
        </div>
      </div>
    </Modale>
  );
};
