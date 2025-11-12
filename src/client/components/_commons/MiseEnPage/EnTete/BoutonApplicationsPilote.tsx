import { ComponentProps, useState } from "react";
import { useSession } from "next-auth/react";
import { $Enums } from "@prisma/client";
import { Icone } from "@/components/_commons/Icone";
import { clsxm } from "@/utils/clsxm";
import { ArrowSLine1Icon } from "@/components/_commons/Icones/ArrowSLine1Icon";
import { useCurrentApplication } from "@/client/hooks/useCurrentApplication";
import { GridIcon } from "@/components/_commons/Icones/GridIcon";
import { Dropdown } from "@/components/shared/Dropdown";
import { LineChartIcon } from "@/components/_commons/Icones/LineChartIcon";
import { QuillPenIcon } from "@/components/_commons/Icones/QuillPenIcon";

const APPLICATIONS = {
  [$Enums.application_accessible.PILOTE]: {
    id: $Enums.application_accessible.PILOTE,
    label: "PILOTE",
    url: "/",
    title: "Piloter mes chantiers",
  },
  [$Enums.application_accessible.PILOTE_EVAL]: {
    id: $Enums.application_accessible.PILOTE_EVAL,
    label: "PILOTE ÉVAL",
    url: "/evaluation",
    title: "Évaluer les résultats",
  },
};

const SectionBouton = ({
  application,
  onSelect,
  icone,
}: {
  application: (typeof APPLICATIONS)[keyof typeof APPLICATIONS];
  onSelect(): void;
  icone: ComponentProps<typeof Icone>["icone"];
}) => {
  const currentApplication = useCurrentApplication();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-gray-600">
        {application.title}
      </span>
      <Dropdown.Link
        className={clsxm(
          "border border-gray-200 rounded min-w-[250px] !flex items-center gap-3 !py-2 !mx-0",
          {
            "!bg-dsfr-alt-blue-france !text-primary":
              currentApplication === application.id,
          },
        )}
        href={application.url}
        onClick={onSelect}
      >
        <Icone className="!h-4 !w-4" icone={icone} />
        {application.label}
      </Dropdown.Link>
    </div>
  );
};

export const BoutonApplicationsPilote = () => {
  const [estDeplie, setEstDeplie] = useState<boolean>(false);
  const session = useSession();
  const applications = session.data?.applicationsAccessibles ?? [];
  const aPlusieursAcces =
    applications.includes($Enums.application_accessible.PILOTE) &&
    applications.includes($Enums.application_accessible.PILOTE_EVAL);

  if (!aPlusieursAcces) return null;

  return (
    <Dropdown.Root onOpenChange={setEstDeplie} open={estDeplie}>
      <Dropdown.Trigger asChild>
        <button
          className="flex items-center !p-0 !text-primary !text-sm"
          type="button"
        >
          <Icone icone={GridIcon} />
          <span className="pl-2 pr-1">La suite PILOTE</span>
          <Icone
            className={clsxm(
              "transition-transform duration-200 ease-in-out",
              estDeplie ? "rotate-90" : "rotate-0",
            )}
            icone={ArrowSLine1Icon}
          />
        </button>
      </Dropdown.Trigger>

      <Dropdown.Content align="end" className="flex flex-col gap-4 !pb-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <img alt="" className="w-8" src="/favicon/favicon.svg" />
          <div className="flex flex-col">
            <span className="font-bold text-base">La suite PILOTE</span>
            <span className="text-xs">
              Piloter l'action publique par le résultat
            </span>
          </div>
        </div>

        <SectionBouton
          application={APPLICATIONS.PILOTE}
          icone={LineChartIcon}
          onSelect={() => setEstDeplie(false)}
        />
        <SectionBouton
          application={APPLICATIONS.PILOTE_EVAL}
          icone={QuillPenIcon}
          onSelect={() => setEstDeplie(false)}
        />
      </Dropdown.Content>
    </Dropdown.Root>
  );
};
