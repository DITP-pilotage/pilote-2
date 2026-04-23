export const CarteNewsletterSkeleton = () => {
  return (
    <div className="flex min-h-48 flex-col rounded border border-gray-200 bg-white p-6">
      <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-5 w-1/2 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-gray-200" />
      <div className="mt-auto h-5 w-5 animate-pulse self-end rounded bg-gray-200" />
    </div>
  );
};

export const ListeNewslettersSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <CarteNewsletterSkeleton key={index} />
      ))}
    </div>
  );
};
