<#import "template.ftl" as layout>
  <@layout.registrationLayout>
    <main class="fr-col-12 fr-mt-14v" role="main" id="content">
      <div class="fr-container fr-container--fluid fr-mb-md-14v">
        <div class="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
          <div class="fr-col-11 fr-col-md-8 fr-col-lg-8">
            <a href="${properties.URL_APPLICATION!}" class="fr-link">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M3.21802 5.33263H11.3327V6.66597H3.21802L6.79402 10.242L5.85135 11.1846L0.666016 5.9993L5.85135 0.813965L6.79402 1.75663L3.21802 5.33263Z" fill="#000091" />
              </svg>
              Retour à la connexion
            </a>
          </div>
          <div class="fr-col-11 fr-col-md-8 fr-col-lg-8 card fr-mt-4w">
            <div class="fr-container fr-background-alt--grey fr-px-4w fr-px-md-0 fr-py-10v fr-py-md-14v">
              <div class="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                <div class="fr-col-12 fr-col-md-9 fr-col-lg-8">
                  <div>
                    <#if message.summary?? && message.summary?contains("Action expir")>
                      <h1 class="instruction fr-h6">
                        Ce lien d'activation a expiré
                      </h1>
                      <p class="fr-mt-2w">
                        Pour des raisons de sécurité, les liens d'activation ont une durée de validité limitée. Celui-ci n'est malheureusement plus actif.
                      </p>
                      <p class="fr-mt-2w">
                        Pour activer votre compte, il vous suffit de <strong>créer un nouveau mot de passe</strong>. Cette étape nous permet de vérifier votre adresse email et d'activer votre compte automatiquement.
                      </p>
                      <#if url.loginResetCredentialsUrl??>
                        <div class="fr-mt-4w">
                          <a href="${url.loginResetCredentialsUrl}" class="fr-btn">
                            Créer un nouveau mot de passe
                          </a>
                        </div>
                      </#if>
                    <#else>
                      <p class="instruction">
                        ${message.summary}
                      </p>
                    </#if>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </main>
    <div id="kc-error-message">
    </div>
  </@layout.registrationLayout>