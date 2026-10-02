import api from "@/server/infrastructure/api/trpc/api";
import { ActualitesIndisponibles } from "./ActualitesIndisponibles";
import { CarteNewsletter } from "./CarteNewsletter";
import { ListeNewslettersSkeleton } from "./CarteNewsletterSkeleton";

const ListeNewsletters = () => {
  const {
    data: newsletters,
    isPending,
    isError,
  } = api.actualites.listerNewsletters.useQuery(undefined, {
    staleTime: 3_600_000,
  });

  if (isPending) {
    return <ListeNewslettersSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-gray-500">
        Les actualités sont momentanément indisponibles.
      </p>
    );
  }

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

type PageActualitesProps = {
  brevoDesactive: boolean;
};

export const PageActualites = ({ brevoDesactive }: PageActualitesProps) => {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Actualités</h1>
      {brevoDesactive ? <ActualitesIndisponibles /> : <ListeNewsletters />}
    </main>
  );
};
