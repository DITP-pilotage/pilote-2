import { Suspense } from "react";
import Loader from "@/components/_commons/Loader/Loader";
import api from "@/server/infrastructure/api/trpc/api";
import { CarteNewsletter } from "./CarteNewsletter";

const ListeNewsletters = () => {
  const [newsletters] = api.actualites.listerNewsletters.useSuspenseQuery(
    undefined,
    { staleTime: 3_600_000 },
  );

  if (newsletters.length === 0) {
    return (
      <p className="text-gray-500">
        Aucune newsletter disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {newsletters.map((newsletter) => (
        <CarteNewsletter key={newsletter.id} newsletter={newsletter} />
      ))}
    </div>
  );
};

export const PageActualites = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Actualités</h1>
      <Suspense fallback={<Loader />}>
        <ListeNewsletters />
      </Suspense>
    </main>
  );
};
