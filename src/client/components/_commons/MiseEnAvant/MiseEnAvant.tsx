import { ComponentType, PropsWithChildren } from "react";
import { Icone } from "@/components/_commons/Icone";
import { QuestionIcon } from "@/components/_commons/Icones/QuestionIcon";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";

const mapIconeVersComponent: Record<
  "question" | "information",
  ComponentType<{ className: string; fill: string }>
> = {
  question: QuestionIcon,
  information: InformationPleineIcon,
};

export const MiseEnAvant = ({
  titre,
  children,
  icone = "question",
}: PropsWithChildren<{
  titre: string;
  icone?: "question" | "information";
}>) => {
  return (
    <div className="border-l-4 border-l-dsfr-blue-france-525 bg-dsfr-grey-925 p-4 pb-1 m-0">
      <h3 className="flex bold !text-primary !text-base gap-1 !mb-0">
        <Icone icone={mapIconeVersComponent[icone]} />
        {titre}
      </h3>
      <div className="text-sm pl-8">{children}</div>
    </div>
  );
};
