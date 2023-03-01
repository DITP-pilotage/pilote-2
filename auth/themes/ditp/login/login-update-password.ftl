<#import "template.ftl" as layout>
  <@layout.registrationLayout>
    <main class="fr-col-12 fr-mt-14v" role="main" id="content">
      <div class="fr-container fr-container--fluid fr-mb-md-14v">
        <div class="fr-grid-row fr-grid-row--center fr-grid-row-gutters">
          <div class="fr-col-11 fr-col-md-8 fr-col-lg-8 card">
            <div class="fr-container fr-background-alt--grey fr-px-4w fr-px-md-0 fr-py-10v fr-py-md-14v">
              <div class="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                <div class="fr-col-12 fr-col-md-9 fr-col-lg-8">
                  <div>
                    <h1 class='fr-h6'>Choissisez votre nouveau mot de passe </h1>
                    <p>Ce champ est obligatoire</p>
                    <#if message?has_content>
                      <#if message.type='error'>
                        <div class="fr-alert fr-alert--error fr-mb-4w">
                          ${kcSanitize(message.summary)?no_esc}
                        </div>
                      </#if>
                    </#if>
                    <form id="kkc-passwd-update-form" action="${url.loginAction}" method="post">
                      <input type="text" id="username" name="username" value="${username}" autocomplete="username" readonly="readonly" style="display:none;" />
                      <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;" />
                      <div class="fr-fieldset__element">
                        <label class="fr-label" for="password-new-input"> Mot de passe</label>
                        <div class="fr-input-wrap">
                          <input class="fr-password__input fr-input" aria-describedby="password-new-input-messages" aria-required="true" name="password-new" autocomplete="new-password" id="password-new" type="password">
                        </div>
                        <label class="fr-label" for="password-confirm-input">Confirmer le mot de passe</label>
                        <div class="fr-input-wrap">
                          <input class="fr-password__input fr-input" aria-describedby="password-confirm-input-messages" aria-required="true" name="password-confirm" autocomplete="new-password" id="password-confirm" type="password">
                        </div>
                        <div class="fr-messages-group" id="password-new-input-messages" aria-live="assertive">
                          <p class="fr-message" id="password-new-input-message">Votre mot de passe doit contenir au moins :</p>
                          <p class="fr-message fr-message--info" id="password-new-input-message-info">15 caractères minimum</p>
                          <p class="fr-message fr-message--info" id="password-new-input-message-info-1">1 chiffre</p>
                          <p class="fr-message fr-message--info" id="password-new-input-message-info-2">1 lettre minuscule</p>
                          <p class="fr-message fr-message--info" id="password-new-input-message-info-3">1 lettre majuscule</p>
                          <p class="fr-message fr-message--info" id="password-new-input-message-info-4">un caractère spécial (exemples : @ $! % &)</p>
                        </div>
                        <div class="fr-password__checkbox fr-checkbox-group fr-checkbox-group--sm">
                          <input aria-label="Afficher le mot de passe" id="password-new-show" type="checkbox" aria-describedby="password-new-show-messages">
                          <label class="fr-password__checkbox fr-label" for="password-new-show"> Afficher </label>
                        </div>
                      </div>
                      <div class="fr-fieldset__element fr-grid-row fr-grid-row--right ">
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