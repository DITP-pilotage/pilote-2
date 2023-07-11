<#import "template.ftl" as layout>
	<@layout.registrationLayout>
		<main class="fr-col-12 fr-mt-14v" role="main" id="content">
			<div class="fr-container fr-container--fluid fr-mb-md-14v">
				<div class="fr-grid-row fr-grid-row--center fr-grid-row-gutters">
					<div class="fr-col-11 fr-col-md-8 fr-col-lg-8 card">
						<div class="fr-container fr-background-alt--grey fr-px-4w fr-px-md-0 fr-py-10v fr-py-md-14v">
							<div class="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
								<div class="fr-col-12 fr-col-md-9 fr-col-lg-8">
									<div id="kc-info-message">
										<p class="instruction">
											${message.summary}
											<#if requiredActions??>
												<#list requiredActions>: <b>
														<#items as reqActionItem>
															${msg("requiredAction.${reqActionItem}")}
															<#sep>,
														</#items>
													</b></#list>
												<#else>
											</#if>
										</p>
										<#if skipLink??>
											<#else>
												<#if pageRedirectUri??>
													<p><a href="${pageRedirectUri}">
															${kcSanitize(msg("backToApplication"))?no_esc}
														</a></p>
													<#elseif actionUri??>
														<p><a href="${actionUri}">
																${kcSanitize(msg("proceedWithAction"))?no_esc}
															</a></p>
														<#elseif client.baseUrl??>
															<p><a href="${client.baseUrl}">
																	${kcSanitize(msg("backToApplication"))?no_esc}
																</a></p>
												</#if>
										</#if>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	</@layout.registrationLayout>