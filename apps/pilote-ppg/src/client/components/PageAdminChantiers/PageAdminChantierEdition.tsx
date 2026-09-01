import { FormProvider } from "react-hook-form";
import Link from "next/link";
import { useState } from "react";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { NavigationTertiaire } from "@/components/_commons/NavigationTertiaire/NavigationTertiaire";
import AlerteMetadataChantier from "@/components/PageAdminChantiers/AlerteMetadataChantier";
import FicheChantier from "@/components/PageAdminChantiers/FicheChantier";
import OngletPonderationsIndicateurs from "@/components/PageAdminChantiers/OngletPonderationsIndicateurs";
import { MetadataChantier } from "@/server/metadataChantier/queries/RecupererChantierQuery";
import {
  useChantierForm,
  defaultChantierVide,
  ChantierForm,
} from "@/components/PageAdminChantiers/useChantierForm";

interface PageAdminChantierEditionProps {
  chantierId: string;
  estUneCréation: boolean;
  chantierData: MetadataChantier | null;
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
  estUneCréation,
  chantierData,
  idSuivant,
}: PageAdminChantierEditionProps) => {
  const chantierIdEffectif = estUneCréation
    ? (idSuivant ?? chantierId)
    : chantierId;

  const defaultValues: ChantierForm = chantierData
    ? {
        ...chantierData,
        conseillerMail: chantierData.conseillerMail ?? "",
      }
    : defaultChantierVide(chantierIdEffectif);

  const { reactHookForm, modifierChantier, creerChantier, alerte } =
    useChantierForm({ defaultValues, chantierId: chantierIdEffectif });

  const [ongletActif, setOngletActif] = useState<Onglet>("metadata");

  const titre = estUneCréation
    ? `Nouveau chantier — ${chantierIdEffectif}`
    : `Chantier ${chantierId}`;

  const labelBouton = estUneCréation ? "Créer le chantier" : "Sauvegarder";

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            className="text-primary hover:text-dsfr-blue-france-sun-113-hover font-medium hover:underline underline-offset-2 transition-colors"
            href="/panel-administrateur/chantiers"
          >
            Gestion des chantiers
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{titre}</span>
        </nav>

        {!estUneCréation && (
          <div className="mb-6">
            <NavigationTertiaire
              items={ONGLETS}
              onValueChange={(valeur) => {
                if (isOnglet(valeur)) setOngletActif(valeur);
              }}
              value={ongletActif}
            />
          </div>
        )}

        {estUneCréation || ongletActif === "metadata" ? (
          <>
            <AlerteMetadataChantier alerte={alerte} />

            <FormProvider {...reactHookForm}>
              <form
                method="post"
                onSubmit={reactHookForm.handleSubmit(
                  estUneCréation ? creerChantier : modifierChantier,
                )}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
                      {estUneCréation ? "Nouveau chantier" : "Édition"}
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {titre}
                    </h1>
                  </div>
                  <Bouton label={labelBouton} variant="primary" type="submit" />
                </div>

                <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden">
                  <div className="px-6 py-6">
                    <FicheChantier />
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                  <Bouton label={labelBouton} variant="primary" type="submit" />
                </div>
              </form>
            </FormProvider>
          </>
        ) : (
          <OngletPonderationsIndicateurs chantierId={chantierIdEffectif} />
        )}
      </div>
    </div>
  );
};

export default PageAdminChantierEdition;
