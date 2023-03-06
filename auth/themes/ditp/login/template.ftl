<#import "components/layout/document.ftl" as document>
  <#import "components/layout/container.ftl" as container>
    <#import "components/dsfr/header/header.ftl" as header>
      <#import "components/dsfr/footer/footer.ftl" as footer>
        <#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayWide=false>
          <html>

          <head>
            <@document.kw />
          </head>

          <body>
            <@header.kw />
            <@container.kw>
              <#nested>
            </@container.kw>
            <@footer.kw />
          </body>

          </html>
        </#macro>
