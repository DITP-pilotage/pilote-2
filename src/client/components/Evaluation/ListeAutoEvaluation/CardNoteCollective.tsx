import Link from "next/link";

export const CardNoteCollective = ({
  titre,
  moyenne,
  lien,
}: {
  titre: string;
  moyenne: number | null;
  lien: string;
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
        Consulter le détail des chantiers collectifs
      </div>
      <Link className="fr-btn !w-full !justify-center" href={lien}>
        Voir le détail
      </Link>
    </section>
  );
};
