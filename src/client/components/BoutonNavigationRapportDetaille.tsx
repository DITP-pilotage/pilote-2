import Link from "next/link";
import { useGetFullQueryParamString } from "@/client/utils/getQueryParamString";
import { Icone } from "@/components/_commons/Icone";
import { ArticleContourIcon } from "@/components/_commons/Icones/ArticleContourIcon";

export const BoutonNavigationRapportDetaille = ({
  territoireCode,
}: {
  territoireCode: string;
}) => {
  const queryParamString = useGetFullQueryParamString();

  return (
    <Link
      className="flex gap-1 !text-sm gap-1 pb-1 !text-primary"
      href={`${territoireCode}/rapport-detaille${queryParamString.length > 0 ? `?${queryParamString}` : ""}`}
      title="Voir le rapport détaillé"
    >
      <Icone className="w-4 h-4" icone={ArticleContourIcon} />
      Voir le rapport détaillé
    </Link>
  );
};
