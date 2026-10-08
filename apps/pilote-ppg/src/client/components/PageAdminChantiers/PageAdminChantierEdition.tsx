import { FormProvider } from "react-hook-form";
import { Button } from "@/components/shared/Button";
import { useState } from "react";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import { Tabs } from "@/components/shared/Tabs";
import FicheChantier from "@/components/PageAdminChantiers/FicheChantier";
import OngletPonderationsIndicateurs from "@/components/PageAdminChantiers/OngletPonderationsIndicateurs";
import { MetadataChantier } from "@/server/parametrage-chantier/queries/GetChantierQuery";
import { IndicateurPonderation } from "@/server/parametrage-chantier/queries/GetIndicateursPonderationsChantierQuery";
import {
  useChantierForm,
  defaultChantierVide,
  ChantierForm,
} from "@/components/PageAdminChantiers/useChantierForm";

interface PageAdminChantierEditionProps {
  chantierId: string;
  isCreation: boolean;
  chantierData: MetadataChantier | null;
  ponderations: IndicateurPonderation[] | null;
  idSuivant: string | null;
}

type Onglet = "metadata" | "ponderations";

const ONGLETS = [
  { value: "metadata", label: "Metadata" },
  { value: "ponderations", label: "Pondérations" },
];

const isOnglet = (value: string): value is Onglet =>
  value === "metadata" || value === "ponderations";

const PageAdminChantierEdition = ({
  chantierId,
  isCreation,
  chantierData,
  ponderations,
  idSuivant,
}: PageAdminChantierEditionProps) => {
  const chantierIdEffectif = isCreation
    ? (idSuivant ?? chantierId)
    : chantierId;

  const defaultValues: ChantierForm = chantierData
    ? {
        ...chantierData,
        conseillerMail: chantierData.conseillerMail ?? "",
      }
    : defaultChantierVide(chantierIdEffectif);

  const { reactHookForm, modifierChantier, creerChantier } = useChantierForm({
    defaultValues,
  });

  const [ongletActif, setOngletActif] = useState<Onglet>("metadata");

  const titre = isCreation
    ? `Nouveau chantier — ${chantierIdEffectif}`
    : `Chantier ${chantierId}`;

  const labelBouton = isCreation ? "Créer le chantier" : "Sauvegarder";

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <FilAriane
          chemin={[
            {
              nom: "Chantiers",
              lien: "/panel-administrateur/chantiers",
            },
          ]}
          libelléPageCourante={titre}
        />

        <div className="mb-6">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
            {isCreation ? "Nouveau chantier" : "Édition"}
          </p>
          <h1 className="text-3xl font-bold text-dsfr-grey-50">{titre}</h1>
        </div>

        {!isCreation && (
          <div className="mb-6">
            <Tabs
              items={ONGLETS}
              onValueChange={(valeur) => {
                if (isOnglet(valeur)) setOngletActif(valeur);
              }}
              value={ongletActif}
            />
          </div>
        )}

        {isCreation || ongletActif === "metadata" ? (
          <>
            <FormProvider {...reactHookForm}>
              <form
                method="post"
                onSubmit={reactHookForm.handleSubmit(
                  isCreation ? creerChantier : modifierChantier,
                )}
              >
                <div className="flex justify-end mb-6">
                  <Button variant="primary" type="submit">
                    {labelBouton}
                  </Button>
                </div>

                <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-925 overflow-hidden">
                  <div className="px-6 py-6">
                    <FicheChantier />
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-dsfr-grey-925">
                  <Button variant="primary" type="submit">
                    {labelBouton}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </>
        ) : (
          <OngletPonderationsIndicateurs ponderations={ponderations ?? []} />
        )}
      </div>
    </div>
  );
};

export default PageAdminChantierEdition;
