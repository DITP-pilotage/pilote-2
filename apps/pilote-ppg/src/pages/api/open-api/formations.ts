import { getContainer } from "@/server/dependances";
import { onlyFormationsApiSecret } from "@/server/framework/guards/onlyFormationsApiSecret";
import { syncFormationsEndpoint } from "@/server/formations/infrastructure/open-api/syncFormationsEndpoint";

export default onlyFormationsApiSecret(
  syncFormationsEndpoint(() =>
    getContainer("formations").resolve("syncFormationsHandler"),
  ),
);
