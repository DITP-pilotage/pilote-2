import Link from "next/link";
import { PropsWithChildren } from "react";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { clsxm } from "@/utils/clsxm";

interface BaseCardEvaluationProps {
  lien: string;
  titre: string;
  rattachement: string;
  moyenne: number | null;
  libelleMoyenne: string;
  texteLienNavigation: string;
  statutCompletion?: "COMPLETER" | "NON_COMPLETE";
  texteCompletion?: "À COMPLÉTER" | "À TRANSMETTRE" | "TRANSMIS";
}

export const BaseCardEvaluation = ({
  lien,
  titre,
  rattachement,
  moyenne,
  libelleMoyenne,
  texteLienNavigation,
  children,
  statutCompletion,
  texteCompletion,
}: PropsWithChildren<BaseCardEvaluationProps>) => {
  return (
    <Link className="block no-underline" href={lien}>
      <section className="flex flex-col gap-4 h-full p-4 bg-white border border-gray-300 !border-b-4 !border-b-dsfr-blue-france-sun-113 rounded cursor-pointer transition-shadow hover:shadow-md">
        <span className="w-fit px-2 py-1.5 text-xs text-blue-600 bg-blue-100 rounded-xl">
          {rattachement}
        </span>
        <header>
          <h3 className="!text-xl !mb-0 font-semibold !text-dsfr-blue-france-sun-113">
            {titre}
          </h3>
        </header>
        <div className="flex justify-end items-end h-10">
          <span className="mr-2 text-grey-200">{libelleMoyenne} : </span>

          {moyenne !== null ? (
            <span
              className={clsxm("text-4xl font-bold", {
                "!text-pilote-yellow": statutCompletion === "NON_COMPLETE",
                "!text-primary": statutCompletion === "COMPLETER",
                "!text-dsfr-grey-625": !statutCompletion,
              })}
            >
              {moyenne}
            </span>
          ) : (
            <span className="text-xl font-bold !text-pilote-yellow">-</span>
          )}
          <span className="text-sm text-grey-200"> / 100</span>
        </div>
        {children}
        <div className="flex items-center justify-between">
          <span className="text-xs text-dsfr-mention-grey">
            {texteLienNavigation}
          </span>
          <Icone icone={ArrowLine1Icon} />
        </div>
      </section>
    </Link>
  );
};
