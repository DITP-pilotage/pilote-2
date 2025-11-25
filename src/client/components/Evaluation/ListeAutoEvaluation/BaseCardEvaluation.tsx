import Link from "next/link";
import { PropsWithChildren, useId } from "react";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { clsxm } from "@/utils/clsxm";
import { SubtractIcon } from "./SubtractIcon";

interface BaseCardEvaluationProps {
  lien: string;
  titre: string;
  texteBadge: string;
  listeInformationsMoyennes: {
    moyenne: number | null;
    misEnAvant?: boolean;
    libelle: string;
  }[];
  texteLienNavigation?: string;
  statutCompletion?: "COMPLETER" | "NON_COMPLETE";
  texteCompletion?:
    | "À COMPLÉTER"
    | "À TRANSMETTRE"
    | "TRANSMIS"
    | "À TRAITER"
    | "TRAITÉ";
}

export const BaseCardEvaluation = ({
  lien,
  titre,
  texteBadge,
  listeInformationsMoyennes,
  texteLienNavigation,
  children,
  statutCompletion,
  texteCompletion,
}: PropsWithChildren<BaseCardEvaluationProps>) => {
  const id = useId();
  return (
    <Link className="block no-underline" href={lien}>
      <section className="relative flex flex-col gap-4 h-full p-4 bg-white border border-gray-300 !border-b-4 !border-b-dsfr-blue-france-sun-113 rounded cursor-pointer transition-shadow hover:shadow-md">
        {statutCompletion && texteCompletion ? (
          <div className="absolute -top-1 right-0 flex items-center gap-1">
            <span
              className={clsxm("text-xs font-semibold", {
                "text-pilote-yellow": statutCompletion === "NON_COMPLETE",
                "text-primary": statutCompletion === "COMPLETER",
              })}
            >
              {texteCompletion}
            </span>
            <SubtractIcon
              className={clsxm("w-8 h-16", {
                "text-pilote-yellow": statutCompletion === "NON_COMPLETE",
                "text-primary": statutCompletion === "COMPLETER",
              })}
            />
          </div>
        ) : null}
        <header className="flex flex-column gap-2">
          <span className="w-fit px-2 py-1.5 text-xs text-blue-600 bg-blue-100 rounded-xl">
            {texteBadge}
          </span>
          <h3 className="!text-xl !mb-0 font-semibold !text-dsfr-blue-france-sun-113">
            {titre}
          </h3>
        </header>
        <div className="flex flex-col justify-end items-end h-10">
          {listeInformationsMoyennes.map((informationMoyenne, index) => {
            return (
              <div className="flex items-end" key={`${id}-${index}`}>
                <span className="mr-2 text-grey-200">
                  {informationMoyenne.libelle} : 
                </span>

                {informationMoyenne.moyenne !== null ? (
                  <span
                    className={clsxm("text-sm", {
                      "!text-4xl font-bold": informationMoyenne.misEnAvant,
                      "!text-pilote-yellow":
                        statutCompletion === "NON_COMPLETE" &&
                        informationMoyenne.misEnAvant,
                      "!text-primary":
                        statutCompletion === "COMPLETER" &&
                        informationMoyenne.misEnAvant,
                      "!text-dsfr-grey-625": !statutCompletion,
                    })}
                  >
                    {informationMoyenne.moyenne}
                  </span>
                ) : (
                  <span
                    className={clsxm("text-xl font-bold", {
                      "!text-pilote-yellow":
                        statutCompletion === "NON_COMPLETE",
                      "!text-primary": statutCompletion === "COMPLETER",
                    })}
                  >
                    -
                  </span>
                )}
                <span className="text-sm text-grey-200"> / 100</span>
              </div>
            );
          })}
        </div>
        {children}
        {texteLienNavigation ? (
          <div className="flex items-center justify-end gap-4">
            <span className="text-xs text-dsfr-mention-grey">
              {texteLienNavigation}
            </span>
            <Icone icone={ArrowLine1Icon} />
          </div>
        ) : null}
      </section>
    </Link>
  );
};
