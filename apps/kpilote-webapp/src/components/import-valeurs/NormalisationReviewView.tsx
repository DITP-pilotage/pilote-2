import { useState } from 'react'
import { type NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurImport'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@pilote/kpilote-ui/Collapsible'
import { ImportPreviewTable } from './ImportPreviewTable'

const decrirePlan = (plan: NormaliserValeursImportResponseApiModel['plan']): string => {
  if (plan.layout === 'long') {
    return (
      `Tableau « long » — individu « ${plan.colonneIndividu} », ` +
      `date « ${plan.colonneDate.nom} », ` +
      `valeur « ${plan.colonneValeur} »`
    )
  }
  return (
    `Tableau « pivot » — individu « ${plan.colonneIndividu} », ` +
    `${plan.colonnesPivot.length} colonne${plan.colonnesPivot.length > 1 ? 's' : ''}-date`
  )
}

function Stat({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-lg font-semibold tabular-nums text-text">{valeur}</div>
      <div className="text-xs text-text-subtle">{libelle}</div>
    </div>
  )
}

export function NormalisationReviewView({
  response,
}: {
  response: NormaliserValeursImportResponseApiModel
}) {
  const { items, warnings, plan, resolution, rapport, resolutionTypeValeur } = response
  const nbImportables = items.length
  const [detailsOuverts, setDetailsOuverts] = useState(false)

  return (
    <div>
      <Collapsible open={detailsOuverts} onOpenChange={setDetailsOuverts} className="mb-3">
        <div className="rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-text">
          <p>
            Extraction assistée : <strong>{nbImportables}</strong> valeur
            {nbImportables > 1 ? 's' : ''} à partir de {rapport.totalLignes} ligne
            {rapport.totalLignes > 1 ? 's' : ''} du fichier.
          </p>
          <CollapsibleTrigger className="mt-1 text-text-subtle underline-offset-2 hover:text-text hover:underline">
            {detailsOuverts ? 'Masquer' : 'Afficher'} le détail de l'extraction
            {warnings.length > 0 ? (
              <>
                {' '}
                ({warnings.length} ligne{warnings.length > 1 ? 's' : ''} ignorée
                {warnings.length > 1 ? 's' : ''})
              </>
            ) : null}
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-3 space-y-4 rounded-lg border border-border bg-background/40 px-4 py-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat libelle="Lignes du fichier" valeur={rapport.totalLignes} />
              <Stat libelle="Valeurs détectées" valeur={rapport.totalItemsProduits} />
              <Stat libelle="Individus reconnus" valeur={rapport.totalLibellesMappes} />
              <Stat libelle="Non reconnus" valeur={rapport.totalLibellesNonResolus} />
            </div>

            <div className="text-sm">
              <div className="font-medium text-text">Structure détectée</div>
              <p className="mt-0.5 text-text-muted">{decrirePlan(plan)}</p>
            </div>

            {resolutionTypeValeur ? (
              <div className="text-sm">
                <div className="font-medium text-text">Type de valeur</div>
                <p className="mt-0.5 text-text-muted">
                  Colonne « {resolutionTypeValeur.colonne} » —{' '}
                  {resolutionTypeValeur.typesValeurRetenus.length > 0 ? (
                    <>
                      valeurs retenues :{' '}
                      <span className="font-mono text-text">
                        {resolutionTypeValeur.typesValeurRetenus.join(', ')}
                      </span>
                    </>
                  ) : (
                    <span className="text-red-marianne">aucune valeur d'avancement identifiée</span>
                  )}
                  {resolutionTypeValeur.typesValeurDistincts.filter(
                    (valeur) => !resolutionTypeValeur.typesValeurRetenus.includes(valeur),
                  ).length > 0 ? (
                    <>
                      {' '}
                      — écartées :{' '}
                      <span className="font-mono text-text-subtle">
                        {resolutionTypeValeur.typesValeurDistincts
                          .filter(
                            (valeur) => !resolutionTypeValeur.typesValeurRetenus.includes(valeur),
                          )
                          .join(', ')}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            ) : null}

            {resolution.mapping.length > 0 ? (
              <div className="text-sm">
                <div className="font-medium text-text">
                  Correspondance des individus ({resolution.mapping.length})
                </div>
                <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-left text-[13px]">
                    <tbody className="divide-y divide-border">
                      {resolution.mapping.map((entree) => (
                        <tr key={entree.libelleSource}>
                          <td className="px-3 py-1.5 text-text-muted">{entree.libelleSource}</td>
                          <td className="px-3 py-1.5 text-text-subtle">→</td>
                          <td className="px-3 py-1.5 font-mono text-text">
                            {entree.individuPublicId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {warnings.length > 0 ? (
              <div className="text-sm">
                <div className="font-medium text-red-marianne">
                  {warnings.length} ligne{warnings.length > 1 ? 's' : ''} ignorée
                  {warnings.length > 1 ? 's' : ''}
                </div>
                <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border px-3 py-2">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-text-muted">
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {nbImportables > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">Valeurs détectées</h3>
          <ImportPreviewTable rows={items} />
        </div>
      ) : null}
    </div>
  )
}
