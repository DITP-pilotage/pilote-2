import mailSend from "@gouvfr/dsfr/dist/artwork/pictograms/digital/mail-send.svg";

const CarteFantome = () => {
  return (
    <div className="flex min-h-48 flex-col rounded border border-gray-200 bg-white p-6">
      <div className="h-6 w-full rounded bg-gray-100" />
      <div className="mt-2 h-6 w-1/3 rounded bg-gray-100" />
      <div className="mt-6 h-4 w-1/2 rounded bg-gray-100" />
      <div className="mt-auto h-5 w-5 self-end rounded bg-gray-100" />
    </div>
  );
};

export const ActualitesIndisponibles = () => {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="grid grid-cols-1 gap-6 opacity-60 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <CarteFantome key={index} />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="flex max-w-xl flex-col items-center rounded border border-gray-200 bg-white px-10 py-8 text-center shadow-lg">
          <svg
            aria-hidden="true"
            className="fr-artwork mb-4 h-20 w-20"
            viewBox="0 0 80 80"
            xmlns="http://www.w3.org/2000/svg"
          >
            <use
              className="fr-artwork-decorative"
              href={`${mailSend.src}#artwork-decorative`}
            />
            <use
              className="fr-artwork-minor"
              href={`${mailSend.src}#artwork-minor`}
            />
            <use
              className="fr-artwork-major"
              href={`${mailSend.src}#artwork-major`}
            />
          </svg>
          <h2 className="text-lg font-bold leading-snug text-blue-900">
            Les newsletters ne sont pas chargées sur cet environnement
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            La connexion à Brevo est désactivée (
            <code className="rounded bg-gray-100 px-1">
              DISABLE_EMAILS=true
            </code>
            ), c&apos;est normal de ne rien voir ici.
          </p>
        </div>
      </div>
    </div>
  );
};
