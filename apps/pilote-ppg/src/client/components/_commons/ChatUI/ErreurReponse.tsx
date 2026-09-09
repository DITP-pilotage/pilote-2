import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";

export const ErreurReponse = ({
  message,
  onReessayer,
}: {
  message: string;
  onReessayer: () => void;
}) => (
  <div className="flex flex-col gap-3">
    <div
      className="flex gap-2.5 border border-error bg-white px-4 py-3 text-sm leading-[22px] text-dsfr-grey-50"
      role="alert"
    >
      <Icone
        className="mt-0.5 h-5 w-5 shrink-0 !text-error"
        icone={ErrorWarningIcon}
      />
      <div>
        <span className="block font-bold">
          La réponse n&apos;a pas pu être générée
        </span>
        {message}
      </div>
    </div>
    <div>
      <Bouton
        label="Réessayer"
        onClick={onReessayer}
        size="sm"
        variant="secondary"
      />
    </div>
  </div>
);
