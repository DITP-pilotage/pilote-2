import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { SaveIcon } from "@/components/_commons/Icones/SaveIcon";
import { formaterDate } from "@/client/utils/date/date";
import { Printer1Icon } from "@/components/_commons/Icones/Printer1Icon";

export const HeaderTableauEvaluation = ({
  dateDerniereModification,
  estEnLectureSeule,
  titre,
}: {
  titre: string;
  estEnLectureSeule: boolean;
  dateDerniereModification: string | null;
}) => (
  <header className="flex justify-between items-end border-b !border-dsfr-blue-france-sun-113 p-6">
    <h1 className="!text-xl !mb-0">{titre}</h1>
    <div className="flex flex-col items-end gap-1">
      {!estEnLectureSeule && (
        <Bouton
          className="underline flex items-center gap-1 !-mr-4"
          iconLeft={<Icone className="!h-4 !w-4" icone={SaveIcon} />}
          label="Enregistrer le brouillon"
          size="sm"
          type="submit"
          variant="link"
        />
      )}
      {dateDerniereModification ? (
        <span className="italic text-sm">
          Dernière modification :{" "}
          {formaterDate(dateDerniereModification, "DD/MM/YYYY [à] H[h]mm")}
        </span>
      ) : null}
      <Bouton
        className="underline flex items-center gap-1 !-mr-4"
        iconLeft={<Icone className="!h-4 !w-4" icone={Printer1Icon} />}
        label="Imprimer"
        size="sm"
        type="button"
        variant="link"
      />
    </div>
  </header>
);
