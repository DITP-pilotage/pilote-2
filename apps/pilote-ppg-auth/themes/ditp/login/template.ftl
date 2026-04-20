<#import "components/layout/document.ftl" as document>
<#import "components/layout/container.ftl" as container>
<#import "components/dsfr/header/header.ftl" as header>
<#import "components/dsfr/footer/footer.ftl" as footer>
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}">
<head>
  <@document.kw />
</head>
<body class="${properties.kcBodyClass!}">
<@header.kw />
<div class="${properties.kcLoginClass!}">
    <div class="${properties.kcFormCardClass!} page-content">
      <div id="kc-content" class="fr-container">
        <div id="kc-content-wrapper" class="fr-grid-row fr-grid-row--center">
          <#nested "form">
        </div>
      </div>
    </div>
  </div>
  <@footer.kw />
</body>
</html>
</#macro>
