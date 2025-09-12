import { Icone } from "@/components/_commons/Icone";
import { clsxm } from "@/utils/clsxm";
import { EarthPleineIcon } from "@/components/_commons/Icones/EarthPleineIcon";
import { CartableIcon } from "@/components/_commons/Icones/CartableIcon";
import { SeedlingIcon } from "@/components/_commons/Icones/SeedlingIcon";
import { LivreIcon } from "@/components/_commons/Icones/LivreIcon";
import { CibleIcon } from "@/components/_commons/Icones/CibleIcon";
import { BallPenIcon } from "@/components/_commons/Icones/BallPenIcon";
import { SunIcon } from "@/components/_commons/Icones/SunIcon";
import { AlarmWarningIcon } from "@/components/_commons/Icones/AlarmWarningIcon";
import { Scales3Icon } from "@/components/_commons/Icones/Scales3Icon";
import { TeamIcon } from "@/components/_commons/Icones/TeamIcon";
import { DiplomeIcon } from "@/components/_commons/Icones/DiplomeIcon";
import { UsineIcon } from "@/components/_commons/Icones/UsineIcon";
import { BallonIcon } from "@/components/_commons/Icones/BallonIcon";
import { GovernmentIcon } from "@/components/_commons/Icones/GovernmentIcon";
import { EgaliteIcon } from "@/components/_commons/Icones/EgaliteIcon";
import { UrneIcon } from "@/components/_commons/Icones/UrneIcon";

const mapIconeMinistereVersIcone = {
  "remix::earth::fill": EarthPleineIcon,
  "material-icons::business_center::filled": CartableIcon,
  "remix::seedling::fill": SeedlingIcon,
  "remix::book-open::fill": LivreIcon,
  "material-icons::radar::filled": CibleIcon,
  "remix::ball-pen::fill": BallPenIcon,
  "dsfr::sun::fill": SunIcon,
  "remix::alarm-warning::fill": AlarmWarningIcon,
  "remix::scales-3::fill": Scales3Icon,
  "remix::team::fill": TeamIcon,
  "material-icons::school::filled": DiplomeIcon,
  "material-icons::factory::filled": UsineIcon,
  "remix::football::fill": BallonIcon,
  "material-symbols::how_to_vote::filled": UrneIcon,
  "material-symbols::equal::outlined": EgaliteIcon,
  "remix::government::fill": GovernmentIcon,
};

export const IconeMinistere = ({
  icone = "remix::government::fill",
  className,
}: {
  icone?: string | null;
  className?: string;
}) => {
  const IconeComponent =
    mapIconeMinistereVersIcone[
      icone as keyof typeof mapIconeMinistereVersIcone
    ] || EarthPleineIcon;

  return (
    <Icone
      className={clsxm("text-current", className)}
      icone={IconeComponent}
    />
  );
};
