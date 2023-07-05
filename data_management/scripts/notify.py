import os
import requests
import time
import json

"""
Voir :
- https://playground.matrix.org/#put-/_matrix/client/v3/rooms/-roomId-/send/-eventType-/-txnId-

Exemple d'utilisation :

$ python3 notify.py 'hello world'
"""


def notify(error_message):
    txnId = int(time.time() * 1000000)
    URL = "{0}/_matrix/client/v3/rooms/{1}/send/m.room.message/{2}?access_token={3}".format(
        os.environ.get('TCHAP_BASE_URL'),
        os.environ.get('TCHAP_ROOM_ID'),
        txnId,
        os.environ.get('TCHAP_ACCESS_TOKEN'),
    )

    r = requests.put(URL, data=json.dumps({
        'body': error_message,
        'msgtype': 'm.text'
    }))

    print(r.content)
