import Head from "next/head";
import { z } from "zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/_commons/Input/Input";

const formSchema = z.object({
  criteres: z
    .object({
      sousCriteres: z
        .object({
          note: z.number(),
          commentaire: z.string().max(600),
        })
        .array(),
    })
    .array(),
});

type FormValues = z.infer<typeof formSchema>;

interface Critere {
  id: string;
  nom: string;
  sousCriteres: Array<{
    id: string;
    nom: string;
    evaluation: {
      note: number;
      commentaire: string;
    };
  }>;
}

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

export default function EvaluationPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      criteres: CRITERES_STUB.map((critere) => ({
        sousCriteres: critere.sousCriteres.map(
          (sousCritere) => sousCritere.evaluation,
        ),
      })),
    },
  });

  const { fields } = useFieldArray({ control: form.control, name: "criteres" });

  console.log(JSON.stringify(form.watch(), null, 2));

  return (
    <main>
      <Head>
        <title>PILOTE - Évaluation</title>
      </Head>

      <div className="min-h-[60vh] py-6">
        <section className="bg-white mx-auto w-full max-w-[1208px]">
          <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
            <span className="font-bold text-sm">Mon auto-évaluation</span>
          </header>
          <div>
            {fields.map((field, index) => {
              const critere = CRITERES_STUB[index];
              return (
                <div key={critere.id}>
                  <header className="py-6 px-4 text-primary font-bold">
                    {critere.nom}
                  </header>
                  <div className="bg-dsfr-grey-925/30">
                    {field.sousCriteres.map((subField, j) => {
                      const sousCritere = critere.sousCriteres[j];
                      const noteInputName =
                        `criteres.${index}.sousCriteres.${j}.note` as const;
                      const commentaireInputName =
                        `criteres.${index}.sousCriteres.${j}.commentaire` as const;

                      return (
                        <div
                          className="py-6 pr-4 pl-12 flex flex-col"
                          key={sousCritere.id}
                        >
                          <div className="flex items-center">
                            <span className="text-primary grow">
                              {sousCritere.nom}
                            </span>
                            <Controller
                              control={form.control}
                              name={noteInputName}
                              render={({ field }) => (
                                <input
                                  className="border !rounded-md !bg-white w-14 aspect-square text-center"
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.valueAsNumber)
                                  }
                                />
                              )}
                            />
                          </div>

                          <Controller
                            control={form.control}
                            name={commentaireInputName}
                            render={({ field }) => (
                              <div className="flex flex-col gap-1 max-w-xl">
                                <label className="font-bold text-sm">
                                  Commentaire
                                </label>
                                <textarea
                                  className="border !rounded-md !bg-white py-2 px-4"
                                  {...field}
                                />
                              </div>
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
