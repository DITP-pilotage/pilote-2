import asyncio
import base64
import os
import tempfile

from markdown2 import Markdown

"""
Envoie le message sur Tchap avec l'appareil `copilot-bot`, chiffré si le salon l'est.
Lit TCHAP_BASE_URL, TCHAP_USER_ID, TCHAP_DEVICE_ID, TCHAP_ACCESS_TOKEN,
TCHAP_OLM_ACCOUNT et TCHAP_ROOM_ID. Même logique que src/proxy/tchap.py du dépôt copilot.
"""


def notify(error_message):
    try:
        asyncio.run(_send(error_message))
    except Exception as e:
        # Un échec de notification ne doit pas masquer l'échec des datajobs.
        print(f"Notification Tchap en échec : {e!r}")


async def _send(error_message):
    from nio import AsyncClient, AsyncClientConfig, RoomSendResponse
    from nio.crypto import OlmAccount
    from nio.store import DefaultStore

    e = os.environ
    user_id, device_id, room_id = e["TCHAP_USER_ID"], e["TCHAP_DEVICE_ID"], e["TCHAP_ROOM_ID"]
    config = AsyncClientConfig(encryption_enabled=True, store_sync_tokens=False, request_timeout=30, max_timeouts=2)
    content = {
        "body": error_message,
        "msgtype": "m.text",
        "format": "org.matrix.custom.html",
        "formatted_body": Markdown().convert(error_message),
    }
    # Seule l'identité de l'appareil est conservée d'un envoi à l'autre.
    with tempfile.TemporaryDirectory() as store_path:
        DefaultStore(user_id, device_id, store_path, pickle_key=config.pickle_key).save_account(
            OlmAccount.from_pickle(base64.b64decode(e["TCHAP_OLM_ACCOUNT"]), "", True)
        )
        client = AsyncClient(e["TCHAP_BASE_URL"], user_id, device_id=device_id, store_path=store_path, config=config)
        try:
            client.restore_login(user_id, device_id, e["TCHAP_ACCESS_TOKEN"])
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
                raise RuntimeError(f"Envoi en échec : {response}")
            print(f"Message Tchap envoyé : {response.event_id}")
        finally:
            await client.close()
