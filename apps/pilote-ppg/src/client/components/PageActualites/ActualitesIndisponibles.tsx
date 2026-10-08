import { Icone } from "@/components/_commons/Icone";
import { MailSend1Icon } from "@/components/_commons/Icones/MailSend1Icon";

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
          <span aria-hidden="true" className="mb-4">
            <Icone className="h-14 w-14" icone={MailSend1Icon} />
          </span>
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
