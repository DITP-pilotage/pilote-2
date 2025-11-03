import Link from "next/link";
import { clsxm } from "@/utils/clsxm";

export const CardEvaluation = ({
  titre,
  moyenne,
  nombreNotes,
  nombreTotal,
  lien,
  variant = "default",
}: {
  titre: string;
  moyenne: number | null;
  nombreNotes: number;
  nombreTotal: number;
  lien: string;
  variant?: "default" | "secondary";
}) => {
  return (
    <section className="bg-white border border-gray-300 rounded p-4 flex flex-col">
      <header className="flex mb-2">
        <h3 className="!text-sm font-semibold grow">{titre}</h3>
        <div className="items-end flex flex-col">
          {moyenne !== null ? (
            <>
              <span className="text-4xl font-bold ">{moyenne}</span>
              <span className="text-gray-400 text-sm"> / 100</span>
            </>
          ) : (
            <span className="text-gray-400 !text-sm">N/A</span>
          )}
        </div>
      </header>

      <div className="text-sm text-gray-600 mb-4 mt-auto">
        Progression{" "}
        <span className="font-semibold">
          {nombreNotes} / {nombreTotal}
        </span>
      </div>
      {nombreTotal > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{
              width: `${(nombreNotes / nombreTotal) * 100}%`,
            }}
          />
        </div>
      )}
      <Link
        className={clsxm("fr-btn !w-full !justify-center", {
          "fr-btn--secondary": variant === "secondary",
        })}
        href={lien}
      >
        Accéder à mon auto-évaluation
      </Link>
    </section>
  );
};
