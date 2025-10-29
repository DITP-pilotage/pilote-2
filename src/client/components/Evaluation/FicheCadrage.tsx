import { Critere, Objectif } from "@/server/evaluation/queries/types";

export type CritereOuObjectif =
  | { type: "critere"; critere: Critere }
  | { type: "objectif"; objectif: Objectif };

export const FicheCadrage = ({
  critereOuObjectif,
}: {
  critereOuObjectif: CritereOuObjectif | null;
}) => {
  if (critereOuObjectif == null) return null;

  return (
    <div className="w-full bg-dsfr-alt-blue-france border-l border-gray-200 inset-shadow-xs">
      <aside className="sticky top-0 p-6">
        <h2 className="!text-lg">
          {critereOuObjectif.type === "objectif"
            ? critereOuObjectif.objectif.libelle
            : critereOuObjectif.critere.libelle}
        </h2>

        <pre>{JSON.stringify(critereOuObjectif, null, 2)}</pre>

        <p>
          Amet qui fugiat veniam commodo aliqua voluptate minim quis. Nostrud
          minim elit eu cillum aliquip deserunt consectetur qui velit minim
          labore excepteur. Est reprehenderit eu excepteur ut do id amet cillum
          non elit. Aliqua commodo sint dolore aute do. Ipsum est culpa elit
          consequat incididunt enim ex. Non ea sint labore commodo incididunt
          consectetur mollit culpa officia aliquip. Consectetur aute adipisicing
          ullamco culpa proident adipisicing irure adipisicing quis velit labore
          nisi dolore. Commodo in ea ullamco consectetur ullamco esse veniam
          esse excepteur labore anim anim. Veniam sit mollit nulla sit quis et
          deserunt aliqua ad dolore. Sunt duis ea anim do consectetur aliquip
          consequat magna in magna cillum cillum sint.
        </p>
      </aside>
    </div>
  );
};
