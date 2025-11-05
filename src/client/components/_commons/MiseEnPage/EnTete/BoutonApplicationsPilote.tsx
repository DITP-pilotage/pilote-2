import { useState } from "react";
import { useSession } from "next-auth/react";
import { $Enums } from "@prisma/client";
import Link from "next/link";
import { Icone } from "@/components/_commons/Icone";
import { clsxm } from "@/utils/clsxm";
import { ArrowSLine1Icon } from "@/components/_commons/Icones/ArrowSLine1Icon";
import { useCurrentApplication } from "@/client/hooks/useCurrentApplication";
import { GridIcon } from "@/components/_commons/Icones/GridIcon";

export const BoutonApplicationsPilote = () => {
  const [estDeplie, setEstDeplie] = useState<boolean>(false);
  const session = useSession();
  const applications = session.data?.applicationsAccessibles ?? [];
  const aPlusieursAcces =
    applications.includes($Enums.application_accessible.PILOTE) &&
    applications.includes($Enums.application_accessible.PILOTE_EVAL);
  const currentApplication = useCurrentApplication();

  if (!aPlusieursAcces) return null;

  const estPiloteEval =
    currentApplication === $Enums.application_accessible.PILOTE_EVAL;
  const labelPrincipal = estPiloteEval ? "PILOTE ÉVAL" : "PILOTE";
  const option = estPiloteEval
    ? { label: "PILOTE", url: "/" }
    : { label: "PILOTE ÉVAL", url: "/evaluation" };

  return (
    <div className="flex flex-col">
      <button
        className="flex fr-text--sm !p-0 !text-primary"
        name="Changer d'application"
        onClick={() => setEstDeplie(!estDeplie)}
        type="button"
      >
        <Icone icone={GridIcon} />
        <span className="pl-2 pr-1">{labelPrincipal}</span>
        <Icone
          className={clsxm(
            "transition-transform duration-200 ease-in-out",
            estDeplie ? "rotate-90" : "rotate-0",
          )}
          icone={ArrowSLine1Icon}
        />
      </button>

      {estDeplie ? (
        <div>
          <Link
            href={option.url}
            onClick={() => setEstDeplie(false)}
            type="button"
          >
            {option.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
};
