import Link from "next/link";
import { $Enums } from "@prisma/client";
import { BadgeFicheEtape } from "@/components/_commons/BadgeFicheEtape/BadgeFicheEtape";
import { clsxm } from "@/utils/clsxm";

type FicheEvaluation = {
  id: string;
  etapeCourante: $Enums.etape_evaluation_enum;
  rattachement: {
    code: string;
    libelle: string;
  };
  objectifs: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
  criteres: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
};

const CardEvaluation = ({
  titre,
  moyenne,
  nombreNotes,
  nombreTotal,
  lien,
  variant = "default",
}: {
  titre: string;
  moyenne: number | null;
  nombreNotes: number;
  nombreTotal: number;
  lien: string;
  variant?: "default" | "secondary";
}) => {
  return (
    <section className="bg-white border border-gray-300 rounded p-4 flex flex-col">
      <header className="flex mb-2">
        <h3 className="!text-sm font-semibold grow">{titre}</h3>
        <div className="items-end flex flex-col">
          {moyenne !== null ? (
            <>
              <span className="text-4xl font-bold ">{moyenne}</span>
              <span className="text-gray-400 text-sm"> / 100</span>
            </>
          ) : (
            <span className="text-gray-400 !text-sm">N/A</span>
          )}
        </div>
      </header>

      <div className="text-sm text-gray-600 mb-4 mt-auto">
        Progression{" "}
        <span className="font-semibold">
          {nombreNotes} / {nombreTotal}
        </span>
      </div>
      {nombreTotal > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{
              width: `${(nombreNotes / nombreTotal) * 100}%`,
            }}
          />
        </div>
      )}
      <Link
        className={clsxm("fr-btn !w-full !justify-center", {
          "fr-btn--secondary": variant === "secondary",
        })}
        href={lien}
      >
        Accéder à mon auto-évaluation
      </Link>
    </section>
  );
};

// eslint-disable-next-line react/no-multi-comp
const CardVide = () => null;

// eslint-disable-next-line react/no-multi-comp
export const ListeAutoEvaluations = ({
  fichesEvaluation,
}: {
  fichesEvaluation: FicheEvaluation[];
}) => {
  return (
    <div className="space-y-8">
      {fichesEvaluation.map((ficheEvaluation) => (
        <div className="bg-white rounded shadow" key={ficheEvaluation.id}>
          <header className="p-4 border-b-2 border-primary text-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                Auto-évaluation - {ficheEvaluation.rattachement.libelle}
              </span>
            </div>
            <BadgeFicheEtape
              etape={ficheEvaluation.etapeCourante}
              taille="petit"
            />
          </header>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <CardEvaluation
                lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}#objectifs`}
                moyenne={ficheEvaluation.objectifs.moyenne}
                nombreNotes={ficheEvaluation.objectifs.nombreNotes}
                nombreTotal={ficheEvaluation.objectifs.nombreTotal}
                titre="Objectifs individuels"
              />
              <CardEvaluation
                lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}`}
                moyenne={ficheEvaluation.criteres.moyenne}
                nombreNotes={ficheEvaluation.criteres.nombreNotes}
                nombreTotal={ficheEvaluation.criteres.nombreTotal}
                titre="Manière de servir"
                variant="secondary"
              />
              <CardVide />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
