import os
import time
import json
import urllib.request
import jwt

key_id   = os.environ['APP_STORE_CONNECT_KEY_IDENTIFIER']
iss_id   = os.environ['APP_STORE_CONNECT_ISSUER_ID']
priv_key = os.environ['APP_STORE_CONNECT_PRIVATE_KEY']

token = jwt.encode(
    {'iss': iss_id, 'exp': int(time.time()) + 1200, 'aud': 'appstoreconnect-v1'},
    priv_key, algorithm='ES256', headers={'kid': key_id}
)
if isinstance(token, bytes):
    token = token.decode()

hdrs = {'Authorization': f'Bearer {token}'}
req = urllib.request.Request(
    'https://api.appstoreconnect.apple.com/v1/certificates'
    '?filter[certificateType]=IOS_DISTRIBUTION',
    headers=hdrs
)
with urllib.request.urlopen(req) as r:
    certs = json.loads(r.read()).get('data', [])

for cert in certs:
    cid = cert['id']
    del_req = urllib.request.Request(
        f'https://api.appstoreconnect.apple.com/v1/certificates/{cid}',
        method='DELETE', headers=hdrs
    )
    try:
        urllib.request.urlopen(del_req)
        print(f'Revoked: {cid}')
    except Exception as e:
        print(f'Could not revoke {cid}: {e}')
