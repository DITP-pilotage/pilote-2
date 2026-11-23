import { FunctionComponent, useEffect, useId, useRef, useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { ArrowDownSLineIcon } from "@/components/_commons/Icones/ArrowDownSLineIcon";
import { TimeIcon } from "@/components/_commons/Icones/TimeIcon";
import type {
  FormationProposee,
  SeanceProposee,
} from "@/server/formations/queries/GetSlideInFormationsQuery";
import { clsxm } from "@/utils/clsxm";
import {
  formaterDebutSeance,
  formaterDuree,
  formaterPlacesRestantes,
} from "./formaterSeance";
import { useSlideInFormations } from "./useSlideInFormations";

const horaire = (seance: SeanceProposee) =>
  `${formaterDebutSeance(seance.dateDebut)} · ${formaterDuree(seance.dureeMinutes)}`;

const libelleDepliage = (nombre: number, deplie: boolean) => {
  if (deplie) {
    return nombre === 1
      ? "Masquer l'autre date"
      : `Masquer les ${nombre} autres dates`;
  }
  return nombre === 1 ? "1 autre date" : `${nombre} autres dates`;
};

const LigneFormation: FunctionComponent<{ formation: FormationProposee }> = ({
  formation,
}) => {
  const [deplie, setDeplie] = useState(false);
  const idAutresDates = useId();
  const [prochaine, ...autres] = formation.seances;
  const places = formaterPlacesRestantes(prochaine.placesRestantes);

  return (
    <li className="flex flex-col gap-1 border-t border-dsfr-grey-925 py-2.5">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-bold leading-[21px]">
            {formation.nom}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] leading-[18px] text-dsfr-grey-200">
            <span aria-hidden="true" className="flex">
              <Icone
                className="h-3.5 w-3.5 text-dsfr-mention-grey"
                icone={TimeIcon}
              />
            </span>
            {horaire(prochaine)}
          </span>
          {places ? (
            <span className="text-[13px] leading-[18px] text-dsfr-warning-425">
              {places}
            </span>
          ) : null}
        </div>
        <a
          className="mt-0.5 flex min-h-11 shrink-0 items-center border border-dsfr-blue-france-sun-113 px-3 text-sm text-dsfr-blue-france-sun-113 no-underline [background-image:none] hover:bg-dsfr-blue-france-975-hover md:min-h-0 md:py-1"
          href={prochaine.urlInscription}
          rel="noopener"
          target="_blank"
          title={`S'inscrire à ${formation.nom}, ${horaire(prochaine)} (nouvelle fenêtre)`}
        >
          S'inscrire
        </a>
      </div>
      {autres.length > 0 ? (
        <>
          <button
            aria-controls={idAutresDates}
            aria-expanded={deplie}
            className="flex min-h-11 items-center gap-1 self-start py-0.5 text-[13px] text-dsfr-blue-france-sun-113 md:min-h-0"
            onClick={() => setDeplie(!deplie)}
            type="button"
          >
            {libelleDepliage(autres.length, deplie)}
            <span aria-hidden="true" className="flex">
              <Icone
                className={clsxm("h-3.5 w-3.5", deplie && "rotate-180")}
                icone={ArrowDownSLineIcon}
              />
            </span>
          </button>
          {deplie ? (
            <ul
              className="m-0 flex list-none flex-col gap-0.5 border-l-2 border-dsfr-blue-france-925 p-0 pl-3"
              id={idAutresDates}
            >
              {autres.map((seance) => {
                const placesSeance = formaterPlacesRestantes(
                  seance.placesRestantes,
                );
                return (
                  <li className="text-[13px] leading-[22px]" key={seance.id}>
                    <a
                      className="inline-flex min-h-11 items-center text-dsfr-blue-france-sun-113 md:inline md:min-h-0"
                      href={seance.urlInscription}
                      rel="noopener"
                      target="_blank"
                      title={`S'inscrire à ${formation.nom}, ${horaire(seance)} (nouvelle fenêtre)`}
                    >
                      {horaire(seance)}
                    </a>
                    {placesSeance ? (
                      <span className="text-dsfr-warning-425">
                        {` · ${placesSeance}`}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </>
      ) : null}
    </li>
  );
};

export const SlideInFormations: FunctionComponent<{
  peutAfficher: boolean;
  pastilleAssistantVisible: boolean;
}> = ({ peutAfficher, pastilleAssistantVisible }) => {
  const { slideIn, visible, masquer, fermer } = useSlideInFormations({
    peutAfficher,
  });
  const idTitre = useId();
  const section = useRef<HTMLElement>(null);

  // Échap ne masque que si le focus est dans la slide-in, qui ne le prend pas d'elle-même.
  useEffect(() => {
    if (!visible) return;
    const masquerSurEchap = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        event.target instanceof Node &&
        section.current?.contains(event.target)
      ) {
        masquer();
      }
    };
    window.addEventListener("keydown", masquerSurEchap);
    return () => window.removeEventListener("keydown", masquerSurEchap);
  }, [visible, masquer]);

  if (!visible || slideIn === null) return null;

  const nombre = slideIn.formations.length;

  return (
    <section
      aria-labelledby={idTitre}
      className={clsxm(
        "fixed inset-x-0 bottom-0 z-[1755] flex max-h-[85vh] flex-col border border-dsfr-grey-900 bg-white text-dsfr-grey-50 shadow-[0_8px_28px_rgba(0,0,18,0.18)] print:hidden",
        "md:inset-x-auto md:right-6 md:w-[400px] md:max-h-[calc(100vh-112px)]",
        pastilleAssistantVisible ? "md:bottom-[88px]" : "md:bottom-6",
      )}
      ref={section}
    >
      <div className="flex items-start gap-2 pb-2.5 pl-5 pr-3 pt-3.5">
        <div className="flex flex-1 flex-col">
          <span className="text-xs font-bold tracking-[0.06em] text-dsfr-blue-france-sun-113">
            CAMPUS PILOTE
          </span>
          <h2 className="m-0 p-0 text-lg leading-6" id={idTitre}>
            {`${nombre} ${nombre === 1 ? "formation" : "formations"} pour votre profil`}
          </h2>
          <p className="m-0 mt-0.5 p-0 text-[13px] leading-[18px] text-dsfr-grey-200">
            Inscription sur Rendez-vous Service Public.
          </p>
        </div>
        <button
          aria-label="Fermer"
          className="flex h-11 w-11 shrink-0 items-center justify-center md:h-10 md:w-10"
          onClick={masquer}
          title="Fermer"
          type="button"
        >
          <span aria-hidden="true" className="flex">
            <Icone className="h-[18px] w-[18px]" icone={CloseLineIcon} />
          </span>
        </button>
      </div>

      <ul className="m-0 flex list-none flex-col overflow-y-auto p-0 px-5">
        {slideIn.formations.map((formation) => (
          <LigneFormation formation={formation} key={formation.id} />
        ))}
      </ul>

      <div className="flex items-center justify-end border-t border-dsfr-grey-925 px-5 pb-3.5 pt-2.5">
        <button
          className="min-h-11 py-2 text-[13px] text-dsfr-grey-200 underline underline-offset-[3px] md:min-h-0"
          onClick={fermer}
          type="button"
        >
          Ne plus me les proposer
        </button>
      </div>
    </section>
  );
};
