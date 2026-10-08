import { Skeleton } from "@/components/shared/Skeleton";

export const CarteNewsletterSkeleton = () => {
  return (
    <div className="flex min-h-48 flex-col rounded border border-gray-200 bg-white p-6">
      <Skeleton className="h-6 w-full rounded" />
      <Skeleton className="mt-2 h-6 w-1/3 rounded" />
      <Skeleton className="mt-6 h-4 w-1/2 rounded" />
      <Skeleton className="mt-auto h-5 w-5 self-end rounded" />
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
