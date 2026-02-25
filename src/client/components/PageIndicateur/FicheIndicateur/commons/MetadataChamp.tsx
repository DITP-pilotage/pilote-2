import { PropsWithChildren } from "react";
import { InformationMetadataContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";

export function MetadataChamp({
  children,
  informationMetadata,
  estEnCoursDeModification,
  valeurAffiché,
  estMandatory = informationMetadata.metaPiloteMandatory,
}: PropsWithChildren<{
  informationMetadata: InformationMetadataContrat;
  estEnCoursDeModification: boolean;
  valeurAffiché: string;
  estMandatory?: boolean;
}>) {
  return (
    <>
      <div className="flex items-center text-base bold mb-1 relative">
        <p className="m-0 overflow-ellipsis">
          {informationMetadata.metaPiloteAlias}
        </p>
        {estEnCoursDeModification ? (
          <>
            {estMandatory ? <ChampObligatoire /> : null}
            {informationMetadata.metaPiloteDispDispDesc ? (
              <Infobulle>{informationMetadata.description}</Infobulle>
            ) : null}
          </>
        ) : null}
      </div>
      {estEnCoursDeModification ? (
        <div className="mt-2">{children}</div>
      ) : (
        <span>{valeurAffiché}</span>
      )}
    </>
  );
}
