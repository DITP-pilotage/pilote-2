import Link from "next/link";
import { FunctionComponent } from "react";
import { Logo } from "@/components/shared/Logo";

const ITEM_CLASSES =
  "relative inline mb-0 ml-0 mr-0 mt-2 not-first:ml-1 md:not-first:ml-3 not-first:before:relative not-first:before:mb-2.5 not-first:before:mr-1 not-first:before:mt-2.5 not-first:before:inline-block not-first:before:h-4 not-first:before:w-px not-first:before:align-middle not-first:before:shadow-[inset_0_0_0_1px_theme(colors.dsfr-grey-900)] not-first:before:content-[''] md:not-first:before:mr-3";

const LINK_CLASSES =
  "text-xs leading-5 text-dsfr-mention-grey [&:not(:hover):not(:active)]:[--underline-idle-width:0]";

const PiedDePage: FunctionComponent = () => {
  return (
    <footer
      className="w-full pt-8 shadow-[inset_0_2px_0_0_theme(colors.primary),inset_0_-1px_0_0_theme(colors.dsfr-grey-900)] [--li-bottom:0] [--ol-content:none] [--ol-start:0] [--ol-type:none] [--ul-start:0] [--ul-type:none] [--xl-block:0] print:hidden"
      id="footer"
      role="contentinfo"
    >
      <div className="fr-container">
        <div className="mb-4 flex flex-row flex-wrap items-center md:mb-6">
          <div className="fr-enlarge-link flex flex-row items-center md:-my-4 md:-ml-4 md:mr-0 md:self-start md:p-4">
            <Link href="/" title="Retour à l'accueil du site">
              <Logo variant="footer" />
            </Link>
          </div>
          <div className="mt-6 flex basis-full flex-wrap md:ml-auto lg:mt-0 lg:max-w-[36.75rem] lg:basis-1/2">
            <p className="w-full text-sm leading-6 [--text-spacing:0_0_0_0] [--underline-img:linear-gradient(0deg,currentColor,currentColor)]">
              PILOTE est le dispositif de suivi des politiques prioritaires du
              gouvernement. Il permet d'évaluer les résultats des politiques
              publiques dans les territoires.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-row flex-wrap items-center shadow-[inset_0_1px_0_0_theme(colors.dsfr-grey-900)]">
          <ul className="m-0 w-full px-0 py-2">
            <li className={ITEM_CLASSES} title="Accessibilité : non conforme">
              <Link className={LINK_CLASSES} href="/accessibilite">
                Accessibilité : non conforme
              </Link>
            </li>
            <li className={ITEM_CLASSES} title="Mentions légales">
              <Link className={LINK_CLASSES} href="/mentions-legales">
                Mentions légales
              </Link>
            </li>
            <li
              className={ITEM_CLASSES}
              title="Données personnelles et cookies"
            >
              <Link
                className={LINK_CLASSES}
                href="/donnees-personnelles-cookies"
              >
                Données personnelles et cookies
              </Link>
            </li>
            <li
              className={ITEM_CLASSES}
              title="Données personnelles et cookies"
            >
              <Link className={LINK_CLASSES} href="/swagger" prefetch={false}>
                Docs API
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default PiedDePage;
