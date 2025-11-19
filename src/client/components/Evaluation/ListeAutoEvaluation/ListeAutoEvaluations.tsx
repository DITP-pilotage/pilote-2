import { $Enums } from "@prisma/client";
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

const formatterTitreEvaluation = ({
  code,
  libelle,
}: {
  code: string;
  libelle: string;
}) => {
  if (code.startsWith("DEPT")) {
    return `${code.split("-")[1]} - ${libelle}`;
  }

  if (code.startsWith("REG")) {
    return `Région ${libelle}`;
  }
  return libelle;
};

export const ListeAutoEvaluations = ({
  fichesEvaluation,
}: {
  fichesEvaluation: FicheEvaluation[];
}) => {
  return (
    <div className="space-y-8">
      {fichesEvaluation.map((ficheEvaluation) => (
        <div className="flex flex-column gap-2" key={ficheEvaluation.id}>
          <header>
            <h2 className="!text-2xl !text-primary !mb-0">
              {formatterTitreEvaluation(ficheEvaluation.rattachement)}
            </h2>
            <ul>
              <li className="!text-pilote-yellow">
                <b>Objectifs individuels</b> : vous avez auto-évalué 2
                objectif(s) sur 5
              </li>
              <li className="!text-pilote-yellow">
                <b>Manière de servir</b> : votre auto-évaluation est complète et
                en attente d'être transmise
              </li>
            </ul>
          </header>

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
              rattachement={ficheEvaluation.rattachement.libelle}
              titre="Objectifs collectifs"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
