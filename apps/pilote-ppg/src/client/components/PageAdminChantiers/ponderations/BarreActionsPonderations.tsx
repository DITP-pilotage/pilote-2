import { Button } from "@/components/shared/Button";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { FiltreStatut } from "@/components/PageAdminChantiers/ponderations/usePonderationsIndicateursForm";

const CLASSES_FILTRE =
  "whitespace-nowrap px-4 py-2 text-dsfr-grey-200 hover:bg-dsfr-grey-975 data-[state=on]:hover:bg-primary";

export const BoutonEnregistrerPonderations = ({
  estEnCoursDEnregistrement,
}: {
  estEnCoursDEnregistrement: boolean;
}) => (
  <Button disabled={estEnCoursDEnregistrement} type="submit" variant="primary">
    Enregistrer
  </Button>
);

const FiltreStatutPonderations = ({
  filtre,
  nombreActifs,
  nombreInactifs,
  onChangerFiltre,
}: {
  filtre: FiltreStatut;
  nombreActifs: number;
  nombreInactifs: number;
  onChangerFiltre: (filtre: FiltreStatut) => void;
}) => (
  <SegmentedControl.Root
    aria-label="Filtrer les indicateurs par statut"
    className="shrink-0 gap-1 p-1 bg-white ring-1 ring-dsfr-grey-925"
    onValueChange={(valeur) => {
      if (valeur) onChangerFiltre(valeur as FiltreStatut);
    }}
    type="single"
    value={filtre}
  >
    <SegmentedControl.Item className={CLASSES_FILTRE} value="tous">
      Tous ({nombreActifs + nombreInactifs})
    </SegmentedControl.Item>
    <SegmentedControl.Item className={CLASSES_FILTRE} value="actifs">
      Actifs ({nombreActifs})
    </SegmentedControl.Item>
    <SegmentedControl.Item className={CLASSES_FILTRE} value="inactifs">
      Inactifs ({nombreInactifs})
    </SegmentedControl.Item>
  </SegmentedControl.Root>
);

const BarreActionsPonderations = ({
  estEnCoursDEnregistrement,
  filtre,
  nombreActifs,
  nombreInactifs,
  nombreModifications,
  onAnnuler,
  onChangerFiltre,
}: {
  estEnCoursDEnregistrement: boolean;
  filtre: FiltreStatut;
  nombreActifs: number;
  nombreInactifs: number;
  nombreModifications: number;
  onAnnuler: () => void;
  onChangerFiltre: (filtre: FiltreStatut) => void;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
    <FiltreStatutPonderations
      filtre={filtre}
      nombreActifs={nombreActifs}
      nombreInactifs={nombreInactifs}
      onChangerFiltre={onChangerFiltre}
    />
    <div className="flex flex-wrap items-center gap-3">
      {nombreModifications > 0 ? (
        <>
          <span className="text-sm text-dsfr-grey-200">
            {nombreModifications > 1
              ? `${nombreModifications} modifications non enregistrées`
              : "1 modification non enregistrée"}
          </span>
          <Button onClick={onAnnuler} type="button" variant="secondary">
            Annuler
          </Button>
        </>
      ) : null}
      <BoutonEnregistrerPonderations
        estEnCoursDEnregistrement={estEnCoursDEnregistrement}
      />
    </div>
  </div>
);

export default BarreActionsPonderations;
