import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";

type PageNewsletterDetailProps = {
  newsletter: Newsletter;
};

export const PageNewsletterDetail = ({
  newsletter,
}: PageNewsletterDetailProps) => {
  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      <div className="border-b border-gray-200 bg-white px-8 pb-5 pt-2">
        <div className="mx-auto max-w-6xl">
          <FilAriane
            chemin={[{ nom: "Actualités", lien: "/actualites" }]}
            libelléPageCourante={newsletter.sujet}
          />
          <div className="mt-4 border-l-4 border-l-blue-700 pl-4">
            <p className="mb-1 text-sm text-gray-400">
              Publié le{" "}
              {PiloteDateFormatter.dateFrancaiseLongue(
                new Date(newsletter.dateEnvoi),
              )}
            </p>
            <h1 className="text-xl font-bold leading-snug text-blue-900 mb-0">
              {newsletter.sujet}
            </h1>
          </div>
        </div>
      </div>
      <iframe
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="w-full flex-1 border-0"
        src={newsletter.lienArchive.replace(/^http:\/\//i, "https://")}
        title={newsletter.sujet}
      />
    </main>
  );
};
