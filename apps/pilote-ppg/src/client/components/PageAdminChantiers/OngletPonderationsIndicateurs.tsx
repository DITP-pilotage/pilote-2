import { useMemo, useState } from "react";
import { FormProvider } from "react-hook-form";
import { Notice } from "@/components/shared/Notice";
import { IndicateurPonderation } from "@/server/parametrage-chantier/queries/GetIndicateursPonderationsChantierQuery";
import {
  FiltreStatut,
  filtrerIndicesParStatut,
  usePonderationsIndicateursForm,
} from "@/components/PageAdminChantiers/ponderations/usePonderationsIndicateursForm";
import BarreActionsPonderations, {
  BoutonEnregistrerPonderations,
} from "@/components/PageAdminChantiers/ponderations/BarreActionsPonderations";
import TableauPonderations from "@/components/PageAdminChantiers/ponderations/TableauPonderations";

const libelleChangementsStatut = (
  nombreReactivations: number,
  nombreDesactivations: number,
) => {
  const morceaux = [];
  if (nombreReactivations > 0) {
    morceaux.push(
      nombreReactivations > 1
        ? `${nombreReactivations} indicateurs seront réactivés`
        : "1 indicateur sera réactivé",
    );
  }
  if (nombreDesactivations > 0) {
    morceaux.push(
      nombreDesactivations > 1
        ? `${nombreDesactivations} indicateurs seront désactivés`
        : "1 indicateur sera désactivé",
    );
  }
  return `${morceaux.join(" et ")} à l'enregistrement.`;
};

const FormulairePonderations = ({
  filtre,
  onChangerFiltre,
  ponderations,
}: {
  filtre: FiltreStatut;
  onChangerFiltre: (filtre: FiltreStatut) => void;
  ponderations: IndicateurPonderation[];
}) => {
  const {
    reactHookForm,
    sommesParMaille,
    sommesEnErreur,
    modifications,
    nombreModifications,
    nombreReactivations,
    nombreDesactivations,
    annuler,
    enregistrer,
    estEnCoursDEnregistrement,
  } = usePonderationsIndicateursForm({ ponderations });

  const nombreActifs = ponderations.filter(
    (ponderation) => ponderation.estActif,
  ).length;

  return (
    <FormProvider {...reactHookForm}>
      <form onSubmit={enregistrer}>
        <BarreActionsPonderations
          estEnCoursDEnregistrement={estEnCoursDEnregistrement}
          filtre={filtre}
          nombreActifs={nombreActifs}
          nombreInactifs={ponderations.length - nombreActifs}
          nombreModifications={nombreModifications}
          onAnnuler={annuler}
          onChangerFiltre={onChangerFiltre}
        />

        {nombreReactivations + nombreDesactivations > 0 ? (
          <Notice
            className="mb-4 rounded px-4"
            containerClassName=""
            variant="info"
          >
            {libelleChangementsStatut(
              nombreReactivations,
              nombreDesactivations,
            )}{" "}
            Le changement de statut s&apos;appliquera au taux d&apos;avancement
            et à la page chantier au prochain calcul des données.
          </Notice>
        ) : null}

        <TableauPonderations
          indicesAffiches={filtrerIndicesParStatut(ponderations, filtre)}
          modifications={modifications}
          ponderations={ponderations}
          sommesEnErreur={sommesEnErreur}
          sommesParMaille={sommesParMaille}
        />

        <div className="flex justify-end mt-6 pt-4 border-t border-dsfr-grey-925">
          <BoutonEnregistrerPonderations
            estEnCoursDEnregistrement={estEnCoursDEnregistrement}
          />
        </div>
      </form>
    </FormProvider>
  );
};

const OngletPonderationsIndicateurs = ({
  ponderations,
}: {
  ponderations: IndicateurPonderation[];
}) => {
  const [filtre, setFiltre] = useState<FiltreStatut>("tous");
  const empreintePonderations = useMemo(
    () => JSON.stringify(ponderations),
    [ponderations],
  );

  if (ponderations.length === 0) {
    return (
      <p className="text-sm text-dsfr-mention-grey">
        Aucun indicateur n&apos;est rattaché à ce chantier.
      </p>
    );
  }

  // Remonter le formulaire quand les données changent (après un enregistrement)
  // repart de valeurs alignées, ligne à ligne, sur les nouvelles pondérations.
  return (
    <FormulairePonderations
      filtre={filtre}
      key={empreintePonderations}
      onChangerFiltre={setFiltre}
      ponderations={ponderations}
    />
  );
};

export default OngletPonderationsIndicateurs;
