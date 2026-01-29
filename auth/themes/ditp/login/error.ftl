<#import "template.ftl" as layout>
  <@layout.registrationLayout>
    <main class="fr-col-12 fr-mt-14v" role="main" id="content">
      <div class="fr-container fr-container--fluid fr-mb-md-14v">
        <div class="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
          <div class="fr-col-11 fr-col-md-8 fr-col-lg-8 card">
            <div class="fr-container fr-background-alt--grey fr-px-4w fr-px-md-0 fr-py-10v fr-py-md-14v">
              <div class="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                <div class="fr-col-12 fr-col-md-9 fr-col-lg-8">
                  <div>
                    <p class="instruction">
                      ${message.summary}
                    </p>
                    <#if client?? && client.baseUrl?has_content>
                      <p>
                        <a id="backToApplication" href="${client.baseUrl}">
                          ${kcSanitize(msg("backToApplication"))?no_esc}
                        </a>
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