<#import "template.ftl" as layout>
  <@layout.registrationLayout>
    <main class="fr-mt-14v" role="main" id="content">
      <div class="fr-container fr-container--fluid fr-mb-md-14v">
        <div class="fr-grid-row fr-grid-row--center fr-grid-row-gutters">
          <div class="fr-col-11 fr-col-md-8 fr-col-lg-8">
            <a href="${url.loginUrl}" class="fr-link">
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
                    <h1 class='fr-h6'>Réinitialiser le mot de passe de votre compte Pilote</h1>
                    <p>Veuillez saisir l’adresse électronique associée à votre compte. Nous vous enverrons plus d’informations pour réinitialiser votre mot de passe.</p>
                    <form id="kc-reset-password-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
                      <div class="fr-fieldset__element">
                        <div class="fr-input-group">
                          <label class="fr-label" for="username-1757">
                            Identifiant
                            <span class="fr-hint-text">Format attendu : nom@domaine.fr</span>
                          </label>
                          <input class="fr-input" autocomplete="username" aria-required="true" aria-describedby="username-1757-messages" name="username" id="username-1757" type="text">
                          <div class="fr-messages-group" id="username-1757-messages" aria-live="assertive">
                          </div>
                        </div>
                      </div>
                      <div class="fr-fieldset__element">
                        <button class="fr-mt-2v fr-btn" type="submit">
                          Valider
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </@layout.registrationLayout>