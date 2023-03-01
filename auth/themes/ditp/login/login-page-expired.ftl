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
                    <p id="instruction1" class="instruction">
                      ${msg("pageExpiredMsg1")}
                      <a id="loginRestartLink" href="${url.loginRestartFlowUrl}">
                        ${msg("doClickHere")}
                      </a> .<br />
                      ${msg("pageExpiredMsg2")}
                      <a id="loginContinueLink" href="${url.loginAction}">
                        ${msg("doClickHere")}
                      </a> .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </main>
  </@layout.registrationLayout>