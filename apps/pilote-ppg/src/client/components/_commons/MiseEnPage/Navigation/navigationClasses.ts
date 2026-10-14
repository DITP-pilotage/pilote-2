// Navigation principale du DSFR (fr-nav) reproduite en Tailwind. Les variables
// --hover / --active / --hover-tint restent celles du DSFR : le survol des liens
// est encore porté par le cœur.

export const NAV_CLASSES =
  "[--li-bottom:0] [--ol-content:none] [--ol-start:0] [--ol-type:none] [--text-spacing:0] [--title-spacing:0] [--ul-start:0] [--ul-type:none] [--underline-img:none] [--xl-block:0]";

export const NAV_LIST_CLASSES =
  "m-0 flex flex-col p-0 lg:flex-row lg:flex-nowrap lg:[&>:first-child:nth-last-child(2)~*]:ml-5 lg:[&>:first-child:nth-last-child(3)~*]:ml-5 lg:[&>:first-child:nth-last-child(4)~*]:ml-5";

// Ajouts de .fr-header .fr-nav__list, quand la navigation est dans l'en-tête.
export const NAV_LIST_HEADER_CLASSES = "lg:-mx-4 lg:max-w-[calc(100%+1rem)]";

export const NAV_ITEM_CLASSES =
  "relative flex flex-[0_1_auto] flex-col items-stretch before:pointer-events-none before:absolute before:inset-0 before:block before:size-full before:shadow-[0_-1px_0_0_var(--border-default-grey),inset_0_-1px_0_0_var(--border-default-grey)] before:content-[''] first:before:shadow-[inset_0_-1px_0_0_var(--border-default-grey)] last:before:shadow-[0_-1px_0_0_var(--border-default-grey)] [&:first-child:last-child]:before:shadow-none lg:static lg:items-start lg:before:content-none";

const NAV_ACTION_CLASSES =
  "m-0 flex h-full w-auto flex-row items-center justify-between px-4 py-3 text-left text-base font-bold leading-6 text-[color:var(--text-action-high-grey)] [--active-tint:var(--active)] [--hover-tint:var(--hover)] lg:min-h-14 lg:p-4 lg:text-sm lg:font-normal lg:leading-6";

const NAV_CURRENT_CLASSES =
  "aria-[current=true]:relative aria-[current=true]:text-[color:var(--text-active-blue-france)] aria-[current=true]:before:absolute aria-[current=true]:before:left-0 aria-[current=true]:before:top-1/2 aria-[current=true]:before:-mt-3 aria-[current=true]:before:block aria-[current=true]:before:h-6 aria-[current=true]:before:w-[2px] aria-[current=true]:before:[background-color:var(--background-active-blue-france)] aria-[current=true]:before:content-[''] aria-[current=true]:before:[--active:var(--background-active-blue-france-active)] aria-[current=true]:before:[--hover:var(--background-active-blue-france-hover)] aria-[current=true]:before:[--idle:transparent] lg:aria-[current=true]:before:bottom-0 lg:aria-[current=true]:before:top-auto lg:aria-[current=true]:before:mt-0 lg:aria-[current=true]:before:h-[2px] lg:aria-[current=true]:before:w-full";

export const NAV_LINK_CLASSES = `${NAV_ACTION_CLASSES} ${NAV_CURRENT_CLASSES}`;

export const NAV_BUTTON_CLASSES = `${NAV_ACTION_CLASSES} ${NAV_CURRENT_CLASSES} after:ml-2 after:mr-0 after:inline-block after:size-4 after:flex-none after:bg-current after:align-[calc((0.75em-1rem)*0.5)] after:[transition:transform_0.3s] after:content-[''] after:[mask-image:url(/dsfr/icons/arrows/arrow-down-s-line.svg)] after:[mask-size:100%_100%] motion-reduce:after:transition-none aria-expanded:[background-color:var(--background-open-blue-france)] aria-expanded:text-[color:var(--text-action-high-blue-france)] aria-expanded:[--active:var(--background-open-blue-france-active)] aria-expanded:[--hover:var(--background-open-blue-france-hover)] aria-expanded:[--idle:transparent] [@media(hover:hover)_and_(pointer:fine)]:aria-expanded:hover:[background-color:var(--hover-tint)] [@media(hover:hover)_and_(pointer:fine)]:aria-expanded:active:[background-color:var(--active-tint)] aria-expanded:after:[transform:rotate(-180deg)] lg:justify-start`;
