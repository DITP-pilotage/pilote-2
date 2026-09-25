import {
  Tableau,
  TableauCellule,
  TableauCelluleEnTete,
  TableauCorps,
  TableauEnTete,
  TableauLigne,
} from "@/components/shared/Tableau";

const SkeletonBar = ({ className }: { className?: string }) => (
  <div className={`bg-gray-200 rounded ${className ?? ""}`} />
);

export const ChantierIndicateursSkeleton = () => {
  return (
    <div className="animate-pulse overflow-hidden">
      <div className="relative">
        <Tableau>
          <TableauEnTete>
            <tr>
              {["w-24", "w-28", "w-28", "w-28", "w-32"].map((width, index) => (
                <TableauCelluleEnTete key={index} scope="col">
                  <SkeletonBar className={`h-4 ${width}`} />
                </TableauCelluleEnTete>
              ))}
            </tr>
          </TableauEnTete>
          <TableauCorps>
            {[0, 1, 2].map((row) => (
              <TableauLigne key={row}>
                <TableauCellule>
                  <SkeletonBar className="h-4 w-40" />
                </TableauCellule>
                <TableauCellule>
                  <SkeletonBar className="h-4 w-16" />
                  <SkeletonBar className="h-3 w-20 mt-1" />
                </TableauCellule>
                <TableauCellule>
                  <SkeletonBar className="h-4 w-16" />
                  <SkeletonBar className="h-3 w-20 mt-1" />
                </TableauCellule>
                <TableauCellule>
                  <SkeletonBar className="h-4 w-16" />
                  <SkeletonBar className="h-3 w-20 mt-1" />
                </TableauCellule>
                <TableauCellule>
                  <SkeletonBar className="h-4 w-full" />
                </TableauCellule>
              </TableauLigne>
            ))}
          </TableauCorps>
        </Tableau>
      </div>
    </div>
  );
};
