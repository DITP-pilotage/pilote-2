<#import "template.ftl" as layout>
  <@layout.registrationLayout>
    <#if realm.password>
      <main class="fr-mt-14v" role="main" id="content">
        <div class="fr-container fr-container--fluid fr-mb-md-14v">
          <div class="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
            <div class="fr-col-11 fr-col-md-8 fr-col-lg-8 card">
              <div class="fr-container fr-background-alt--grey fr-px-4w fr-px-md-0 fr-py-10v fr-py-md-14v">
                <div class="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                  <div class="fr-col-12 fr-col-md-9 fr-col-lg-8">
                    <div>
                      <form id="kc-form-login" action="${url.loginAction}" method="post" onsubmit="login.disabled = true; return true;">
                        <fieldset class="fr-fieldset" id="login-1760-fieldset" aria-labelledby="login-1760-fieldset-legend login-1760-fieldset-messages">
                          <legend class="fr-fieldset__legend" id="login-1760-fieldset-legend">
                            <h1 class='fr-h5'>Se connecter avec son compte</h1>
                          </legend>
                          <#if message?has_content>
                            <#if message.type='error'>
                              <div class="fr-alert fr-alert--error fr-mb-4w">
                                <p>L'une des erreurs suivantes est survenue</p>
                                <ul>
                                  <li>
                                    <strong>Votre identifiant ou votre mot de passe est erroné</strong>
                                  </li>
                                  <li>
                                    <strong>Vous compte n’existe pas</strong> : faites-en la demande en cliquant sur le bouton “Demander à créer mon compte”
                                  </li>
                                  <li>
                                    <strong>Votre demande de compte est encore en attente de validation</strong> : attendez qu’elle soit validée par votre référent, et vous recevrez un courriel intitulé “création de compte Pilote” de confirmation vous invitant à créer votre mot de passe
                                  </li>
                                  <li>
                                    <strong>Vous n’avez pas défini votre mot de passe</strong> : cliquez sur le lien inclus dans le courriel de confirmation de création de compte
                                  </li>
                                </ul>
                              </div>
                              <#elseif message.type='success'>
                                <div class="fr-alert fr-alert--success fr-mb-4w">
                                  <p>
                                    ${kcSanitize(message.summary)?no_esc}
                                  </p>
                                </div>
                                <#else>
                                  <div class="fr-alert fr-alert--info fr-mb-4w">
                                    <p>
                                      ${kcSanitize(message.summary)?no_esc}
                                    </p>
                                  </div>
                            </#if>
                          </#if>
                          <div class="fr-fieldset__element">
                            <fieldset class="fr-fieldset fr-mb-0" id="credentials" aria-labelledby="credentials-messages">
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
                                <div class="fr-password" id="password-1758">
                                  <label class="fr-label" for="password-1758-input">
                                    Mot de passe
                                  </label>
                                  <div class="fr-input-wrap">
                                    <input class="fr-password__input fr-input" aria-describedby="password-1758-input-messages" aria-required="true" name="password" autocomplete="current-password" id="password-1758-input" type="password">
                                  </div>
                                  <div class="fr-messages-group" id="password-1758-input-messages" aria-live="assertive">
                                  </div>
                                  <div class="fr-password__checkbox fr-checkbox-group fr-checkbox-group--sm">
                                    <input aria-label="Afficher le mot de passe" id="password-1758-show" type="checkbox" aria-describedby="password-1758-show-messages">
                                    <label class="fr-password__checkbox fr-label" for="password-1758-show">
                                      Afficher
                                    </label>
                                    <div class="fr-messages-group" id="password-1758-show-messages" aria-live="assertive">
                                    </div>
                                  </div>
                                  <#if realm.resetPasswordAllowed>
                                    <p class='fr-mb-0'>
                                      <a href="${url.loginResetCredentialsUrl}" class="fr-link">Mot de passe oublié ?</a>
                                    </p>
                                  </#if>
                                </div>
                              </div>
                            </fieldset>
                          </div>
                          <#if realm.rememberMe>
                            <div class="fr-fieldset__element">
                              <div class="fr-checkbox-group fr-checkbox-group--sm">
                                <input name="remember" id="remember-1759" type="checkbox" aria-describedby="remember-1759-messages">
                                <label class="fr-label" for="remember-1759">
                                  Se souvenir de moi
                                </label>
                              </div>
                            </div>
                          </#if>
                          <div class="fr-fieldset__element">
                            <ul class="fr-btns-group">
                              <li>
                                <button class="fr-mt-2v fr-btn" type="submit">
                                  Se connecter
                                </button>
                              </li>
                            </ul>
                          </div>
                          <div class="fr-messages-group" id="login-1760-fieldset-messages" aria-live="assertive">
                          </div>
                        </fieldset>
                      </form>
                    </div>
                    <#if realm.registrationAllowed>
                      <p class="fr-hr-or">ou</p>
                      <h2 class='fr-h5'>Vous n’avez pas de compte ?</h2>
                      <ul class="fr-btns-group">
                        <li>
                          <a href="${url.registrationUrl}" class="fr-btn fr-btn--secondary">
                            Demander à créer mon compte
                          </a>
                        </li>
                      </ul>
                    </#if>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </#if>
  </@layout.registrationLayout>