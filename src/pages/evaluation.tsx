import Head from "next/head";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import {
  Critere,
  EtapeCriteres,
} from "@/components/PageEvaluation/EtapeCriteres";
import { formSchema, FormValues } from "@/components/PageEvaluation/form";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";
import {
  EtapeObjectifs,
  Objectif,
} from "@/components/PageEvaluation/EtapeObjectifs";
import { formaterDate } from "@/client/utils/date/date";

const CRITERES_STUB: Critere[] = [
  {
    id: "1",
    nom: "Déploiement territorial de la Feuille de route interministérielle",
    sousCriteres: [
      {
        id: "1-1",
        nom: "Gouvernance en place autour du préfet",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
      {
        id: "1-2",
        nom: "PILOTE – Pilotage qualitatif des données",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
    ],
  },
  {
    id: "2",
    nom: "Simplification",
    sousCriteres: [
      {
        id: "2-1",
        nom: "Initiatives prises en matière de simplification ",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
      {
        id: "2-2",
        nom: "Contribution à France Simplification",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
      {
        id: "2-3",
        nom: "Autres mesures de simplification mises en œuvre",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
    ],
  },
  {
    id: "3",
    nom: "Accès et qualité des services publics",
    sousCriteres: [
      {
        id: "3-1",
        nom: "Organisation et actions mises en place ou envisagée pour améliorer l’accès aux services publics",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
      {
        id: "3-2",
        nom: "Appui au déploiement du programme SP+",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
      {
        id: "3-3",
        nom: "France Services",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
    ],
  },
  {
    id: "4",
    nom: "Communication",
    sousCriteres: [
      {
        id: "4-1",
        nom: "Valorisation des PPG, dont celle publiées au Baromètre des résultats de l’action publique ",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
      {
        id: "4-2",
        nom: "Actions de communication demandées par le SIG ",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
      {
        id: "4-3",
        nom: "Toutes actions ou prises de parole valorisant la mobilisation de l’Etat dans votre territoire ",
        evaluation: {
          note: 0,
          commentaire: "",
        },
      },
    ],
  },
];

const OBJECTIFS_STUB: Objectif[] = [
  {
    id: "1",
    nom: "Déployer un plan numérique éducatif dans les collèges et lycées",
    evaluation: {
      note: 0,
      commentaire: "",
    },
  },
  {
    id: "2",
    nom: " Valoriser le patrimoine historique de Caen, Rouen et le Mont-Saint-Michel",
    evaluation: {
      note: 0,
      commentaire: "",
    },
  },
  {
    id: "3",
    nom: "Transition écologique et Cohésion des territoires",
    evaluation: {
      note: 0,
      commentaire: "",
    },
  },
  {
    id: "4",
    nom: "Faire de Besançon une référence du sport universitaire",
    evaluation: {
      note: 0,
      commentaire: "",
    },
  },
  {
    id: "5",
    nom: "Renforcer l’insertion des jeunes dans les métiers industriels",
    evaluation: {
      note: 0,
      commentaire: "",
    },
  },
];

export default function EvaluationPage() {
  const [etape, setEtape] = useState<"criteres" | "objectifs">("criteres");
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      criteres: CRITERES_STUB.map((critere) => ({
        sousCriteres: critere.sousCriteres.map(
          (sousCritere) => sousCritere.evaluation,
        ),
      })),
      objectifs: OBJECTIFS_STUB.map((objectif) => objectif.evaluation),
    },
  });

  console.log(form.watch());

  return (
    <main className="py-6">
      <Head>
        <title>PILOTE - Évaluation</title>
      </Head>

      <div className="min-h-[60vh]">
        <section className="bg-white mx-auto w-full max-w-4xl">
          <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
            <span className="font-bold text-sm">Mon auto-évaluation</span>
          </header>
          <FormProvider {...form}>
            {etape === "criteres" && <EtapeCriteres criteres={CRITERES_STUB} />}
            {etape === "objectifs" && (
              <EtapeObjectifs objectifs={OBJECTIFS_STUB} />
            )}
          </FormProvider>
        </section>
      </div>

      <div className="sticky flex items-center justify-between mt-4 bottom-8 mx-auto w-full max-w-4xl bg-white px-6 py-4">
        <span className="italic text-sm">
          Dernière modification : {formaterDate("2025-10-01", "DD/MM/YYYY")}
        </span>
        {etape === "criteres" && (
          <Bouton
            className="ml-auto"
            iconRight={
              <Icone className="text-current" icone={ArrowLine1Icon} />
            }
            label="Objectitfs"
            onClick={() => {
              setEtape("objectifs");
              window.scrollTo(0, 0);
            }}
          />
        )}
        {etape === "objectifs" && (
          <div className="ml-auto flex items-center gap-4">
            <Bouton
              iconLeft={
                <Icone className="text-current" icone={ArrowLine3Icon} />
              }
              label="Critères"
              onClick={() => setEtape("criteres")}
              variant="secondary"
            />
            <Bouton
              label="Soumettre"
              onClick={() => console.log("Hello world")}
            />
          </div>
        )}
      </div>
    </main>
  );
}
