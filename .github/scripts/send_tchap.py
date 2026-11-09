"""Envoie un message chiffré sur Tchap avec l'appareil `copilot-bot`.

Lit TCHAP_BASE_URL, TCHAP_BOT_USER_ID, TCHAP_BOT_DEVICE_ID, TCHAP_BOT_ACCESS_TOKEN,
TCHAP_BOT_OLM_ACCOUNT, TCHAP_ROOM_ID, BODY (texte brut) et FORMATTED_BODY (HTML).
Le message est chiffré si le salon l'est, et le script échoue plutôt que d'envoyer en clair.
Même logique que src/proxy/tchap.py du dépôt copilot.
"""

import asyncio
import base64
import os
import tempfile

from nio import AsyncClient, AsyncClientConfig, RoomSendResponse
from nio.crypto import OlmAccount
from nio.store import DefaultStore

e = os.environ


async def main():
    user_id, device_id, room_id = e["TCHAP_BOT_USER_ID"], e["TCHAP_BOT_DEVICE_ID"], e["TCHAP_ROOM_ID"]
    config = AsyncClientConfig(encryption_enabled=True, store_sync_tokens=False, request_timeout=30, max_timeouts=2)
    content = {
        "body": e["BODY"],
        "msgtype": "m.text",
        "format": "org.matrix.custom.html",
        "formatted_body": e["FORMATTED_BODY"],
    }
    # Seule l'identité de l'appareil est conservée d'un envoi à l'autre.
    with tempfile.TemporaryDirectory() as store_path:
        DefaultStore(user_id, device_id, store_path, pickle_key=config.pickle_key).save_account(
            OlmAccount.from_pickle(base64.b64decode(e["TCHAP_BOT_OLM_ACCOUNT"]), "", True)
        )
        client = AsyncClient(e["TCHAP_BASE_URL"], user_id, device_id=device_id, store_path=store_path, config=config)
        try:
            client.restore_login(user_id, device_id, e["TCHAP_BOT_ACCESS_TOKEN"])
            await client.sync(
                timeout=0,
                full_state=True,
                sync_filter={
                    "room": {
                        "rooms": [room_id],
                        "timeline": {"limit": 0},
                        "ephemeral": {"types": []},
                        "account_data": {"types": []},
                    },
                    "presence": {"types": []},
                    "account_data": {"types": []},
                },
            )
            client.rooms[room_id]  # Lève une erreur plutôt que de deviner si le salon est chiffré
            await client.joined_members(room_id)
            if client.should_query_keys:
                await client.keys_query()
            response = await client.room_send(room_id, "m.room.message", content, ignore_unverified_devices=True)
            if not isinstance(response, RoomSendResponse):
                raise RuntimeError(f"Envoi Tchap en échec : {response}")
            print(f"Message envoyé : {response.event_id}")
        finally:
            await client.close()


asyncio.run(main())
