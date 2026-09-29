import { FunctionComponent } from "react";
import { formaterDate } from "@/client/utils/date/date";
import { clsxm } from "@/utils/clsxm";

interface ValeurEtDateProps {
  valeur: number | null;
  date?: string | null;
  unité?: string | null;
  modeImpression?: boolean;
}

const ValeurEtDate: FunctionComponent<ValeurEtDateProps> = ({
  valeur,
  date,
  unité,
  modeImpression = false,
}) => {
  const dateFormatée = formaterDate(date, "MM/YYYY");
  return (
    <>
      <p className={clsxm(!modeImpression && "mb-0")}>
        {valeur !== null && valeur !== undefined
          ? valeur?.toLocaleString() +
            (unité?.toLocaleLowerCase() === "pourcentage" ? " %" : "")
          : ""}
      </p>
      {!!dateFormatée && (
        <p
          className={clsxm(
            "h-4 text-[10px] leading-4",
            modeImpression ? "!text-dsfr-mention-grey" : "mb-0 texte-gris",
          )}
        >
          {`(${dateFormatée})`}
        </p>
      )}
    </>
  );
};

export default ValeurEtDate;
