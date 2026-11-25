import { useEffect, useId, useRef } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { Button } from "@/components/shared/Button";
import { clsxm } from "@/utils/clsxm";
import { LigneFormation } from "./LigneFormation";
import { useSlideInFormations } from "./useSlideInFormations";

export const SlideInFormations = ({
  peutAfficher,
  pastilleAssistantVisible,
}: {
  peutAfficher: boolean;
  pastilleAssistantVisible: boolean;
}) => {
  const { slideIn, visible, masquer, fermer, trackInscription } =
    useSlideInFormations({
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
            {nombre === 1
              ? "1 formation adaptée à votre profil"
              : `${nombre} formations adaptées à votre profil`}
          </h2>
          <p className="m-0 mt-0.5 p-0 text-[13px] leading-[18px] text-dsfr-grey-200">
            Inscription sur Rendez-vous Service Public.
          </p>
        </div>
        <Button
          aria-label="Fermer"
          className="shrink-0 justify-center px-2 max-md:min-h-11 max-md:min-w-11"
          iconLeft={
            <span aria-hidden="true" className="flex">
              <Icone
                className="h-[18px] w-[18px] text-current"
                icone={CloseLineIcon}
              />
            </span>
          }
          onClick={masquer}
          size="sm"
          title="Fermer"
          variant="tertiary-no-outline"
        />
      </div>

      <ul className="m-0 flex list-none flex-col overflow-y-auto p-0 px-5">
        {slideIn.formations.map((formation) => (
          <LigneFormation
            formation={formation}
            key={formation.id}
            onInscription={() => trackInscription(formation)}
          />
        ))}
      </ul>

      <div className="flex items-center justify-end border-t border-dsfr-grey-925 px-5 pb-3.5 pt-2.5">
        <Button
          className="max-md:min-h-11"
          onClick={fermer}
          size="sm"
          variant="tertiary"
        >
          Ne plus afficher ces suggestions
        </Button>
      </div>
    </section>
  );
};
