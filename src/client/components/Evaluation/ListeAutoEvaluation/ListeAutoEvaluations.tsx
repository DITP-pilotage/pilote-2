import { $Enums } from "@prisma/client";
import { BadgeFicheEtape } from "@/components/_commons/BadgeFicheEtape/BadgeFicheEtape";
import { CardEvaluation } from "./CardEvaluation";
import { CardNoteCollective } from "./CardNoteCollective";

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
  noteCollective: number | null;
};

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
              taille="grand"
            />
          </header>

          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <CardEvaluation
                lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}/objectifs`}
                moyenne={ficheEvaluation.objectifs.moyenne}
                nombreNotes={ficheEvaluation.objectifs.nombreNotes}
                nombreTotal={ficheEvaluation.objectifs.nombreTotal}
                titre="Objectifs individuels"
              />
              <CardEvaluation
                lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}/manieres-de-servir`}
                moyenne={ficheEvaluation.criteres.moyenne}
                nombreNotes={ficheEvaluation.criteres.nombreNotes}
                nombreTotal={ficheEvaluation.criteres.nombreTotal}
                titre="Manière de servir"
                variant="secondary"
              />
              <CardNoteCollective
                lien={`/evaluation/note-collective/${ficheEvaluation.rattachement.code}`}
                moyenne={ficheEvaluation.noteCollective}
                titre="Objectifs collectifs"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
