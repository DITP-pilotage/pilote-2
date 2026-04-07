const SkeletonBar = ({ className }: { className?: string }) => (
  <div className={`bg-gray-200 rounded ${className ?? ""}`} />
);

export const ValeursIndicateurSkeleton = () => {
  return (
    <div className="animate-pulse overflow-hidden">
      <div className="fr-table fr-p-0 fr-m-0">
        <table className="!table">
          <thead>
            <tr>
              {["w-24", "w-28", "w-28", "w-28", "w-32"].map((width, index) => (
                <th key={index} scope="col">
                  <SkeletonBar className={`h-4 ${width}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((row) => (
              <tr key={row}>
                <td>
                  <SkeletonBar className="h-4 w-40" />
                </td>
                <td>
                  <SkeletonBar className="h-4 w-16" />
                  <SkeletonBar className="h-3 w-20 mt-1" />
                </td>
                <td>
                  <SkeletonBar className="h-4 w-16" />
                  <SkeletonBar className="h-3 w-20 mt-1" />
                </td>
                <td>
                  <SkeletonBar className="h-4 w-16" />
                  <SkeletonBar className="h-3 w-20 mt-1" />
                </td>
                <td>
                  <SkeletonBar className="h-4 w-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
