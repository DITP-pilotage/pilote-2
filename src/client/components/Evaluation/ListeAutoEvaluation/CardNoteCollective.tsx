import Link from "next/link";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";

export const CardNoteCollective = ({
  titre,
  moyenne,
  lien,
  rattachement,
}: {
  titre: string;
  moyenne: number | null;
  lien: string;
  rattachement: string;
}) => {
  return (
    <Link className="block no-underline" href={lien}>
      <section className="flex flex-col h-full p-4 bg-white border border-gray-300 !border-b-4 !border-b-dsfr-blue-france-sun-113 rounded cursor-pointer transition-shadow hover:shadow-md">
        <header className="mb-2">
          <span className="px-2 py-1.5 text-xs text-blue-600 bg-blue-100 rounded-xl">
            {rattachement}
          </span>
          <h3 className="!mt-4 !text-xl font-semibold !text-dsfr-blue-france-sun-113">
            {titre}
          </h3>
        </header>
        <div className="flex justify-end items-end">
          <span>
            <span className="mr-2 text-grey-200">
              taux d&apos;avancement :{" "}
            </span>
            <span className="text-4xl font-bold text-dsfr-grey-625">
              {moyenne !== null ? moyenne : "-"}
            </span>
            <span className="text-sm text-grey-200"> / 100</span>
          </span>
        </div>
        <div className="py-4 text-xs text-grey-200">
          Taux constaté dans PILOTE, en attente de la saisie finalisée des
          données par les ministères en charge des chantiers
        </div>
        <div className="flex items-center justify-between mt-auto mb-4">
          <span className="text-xs text-dsfr-mention-grey">
            Consulter la liste des objectifs collectifs
          </span>
          <Icone icone={ArrowLine1Icon} />
        </div>
      </section>
    </Link>
  );
};
