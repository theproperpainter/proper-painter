"""
THE PROPER PAINTER — Re-link a Bank Account (Plaid update mode)
================================================================
Use this when the balance sync reports:
  "the login details of this item have changed ... use Link's update mode"
(Plaid error ITEM_LOGIN_REQUIRED).

Unlike plaid_setup.py, this keeps the SAME access_token, so nothing needs to be
changed in Apps Script afterwards. You just log in to the bank again.

Usage:  python plaid_relink.py
"""

import os
import json
import webbrowser
import threading
import sys
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

try:
    from dotenv import load_dotenv
    import plaid
    from plaid.api import plaid_api
    from plaid.model.link_token_create_request import LinkTokenCreateRequest
    from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
    from plaid.model.country_code import CountryCode
except ImportError:
    print("ERROR: Required packages not installed.")
    print("Please double-click  install.bat  first, then re-run this script.")
    input("\nPress ENTER to exit...")
    sys.exit(1)

# ── Paths ──────────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
ENV_PATH    = os.path.join(SCRIPT_DIR, '.env')
CONFIG_PATH = os.path.join(SCRIPT_DIR, 'plaid_config.json')
PORT        = 8765

load_dotenv(ENV_PATH)

CLIENT_ID = os.getenv('PLAID_CLIENT_ID', '')
SECRET    = os.getenv('PLAID_SECRET', '')
ENV_NAME  = os.getenv('PLAID_ENV', 'production').lower()

if not CLIENT_ID or CLIENT_ID == 'your_client_id_here':
    print("ERROR: Plaid credentials not configured.")
    print(f"Please edit the .env file in:\n  {SCRIPT_DIR}")
    input("\nPress ENTER to exit...")
    sys.exit(1)

_env_urls = {
    'production':  'https://production.plaid.com',
    'development': 'https://development.plaid.com',
    'sandbox':     'https://sandbox.plaid.com',
}
PLAID_HOST = _env_urls.get(ENV_NAME, 'https://production.plaid.com')

client = plaid_api.PlaidApi(plaid.ApiClient(plaid.Configuration(
    host=PLAID_HOST,
    api_key={'clientId': CLIENT_ID, 'secret': SECRET},
)))

_state = {'done': False, 'error': None}
_access_token = {'value': None}


def _get_attr(obj, key):
    """Works for both object (SDK v9+) and dict-style Plaid responses."""
    if isinstance(obj, dict):
        return obj[key]
    return getattr(obj, key)


def _create_update_link_token(access_token):
    # Update mode: pass the existing access_token and NO products.
    req = LinkTokenCreateRequest(
        client_name='The Proper Painter',
        country_codes=[CountryCode('US')],
        language='en',
        user=LinkTokenCreateRequestUser(client_user_id='proper-painter-1'),
        access_token=access_token,
    )
    return _get_attr(client.link_token_create(req), 'link_token')


def _link_page_html(link_token):
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>The Proper Painter — Re-link Bank</title>
  <style>
    body{{margin:0;font-family:Arial,sans-serif;background:#111;
         display:flex;align-items:center;justify-content:center;height:100vh}}
    .card{{background:#fff;padding:48px 40px;border-radius:12px;text-align:center;max-width:380px}}
    h2{{font-size:22px;margin:0 0 8px}}
    p{{color:#666;font-size:14px;margin:0 0 28px;line-height:1.6}}
    button{{background:#000;color:#fff;border:none;padding:14px 36px;
            border-radius:8px;font-size:15px;cursor:pointer;width:100%}}
    button:hover{{background:#333}}
  </style>
</head>
<body>
  <div class="card">
    <h2>&#127912; The Proper Painter</h2>
    <p>Your bank needs you to log in again.<br>
       This restores the existing connection &mdash; no other changes needed.</p>
    <button onclick="openPlaid()">Re-authenticate Bank</button>
  </div>
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <script>
    function openPlaid() {{
      var h = Plaid.create({{
        token: '{link_token}',
        onSuccess: function() {{ window.location.href = '/callback'; }},
        onExit: function(err) {{
          if (err) alert('Something went wrong: ' + (err.display_message || err.error_message));
        }}
      }});
      h.open();
    }}
  </script>
</body>
</html>"""


class RelinkHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        try:
            if path == '/':
                token = _create_update_link_token(_access_token['value'])
                self._respond(200, 'text/html', _link_page_html(token).encode())
            elif path == '/callback':
                _state['done'] = True
                self._respond(200, 'text/html',
                    b'<html><body style="font-family:Arial;text-align:center;padding:60px">'
                    b'<h2>&#10003; Bank re-linked!</h2><p>You can close this window.</p></body></html>')
                threading.Thread(target=self.server.shutdown, daemon=True).start()
            else:
                self._respond(404, 'text/plain', b'Not found')
        except Exception as e:
            print(f"\n  ERROR in browser handler:\n{traceback.format_exc()}", flush=True)
            _state['error'] = str(e)
            self._respond(500, 'text/html',
                f'<html><body style="font-family:Arial;padding:40px"><h2 style="color:#c00">Error</h2>'
                f'<pre>{e}</pre></body></html>'.encode())
            threading.Thread(target=self.server.shutdown, daemon=True).start()

    def _respond(self, code, ctype, body):
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


def main():
    print()
    print("=" * 54)
    print("  THE PROPER PAINTER — Re-link Bank Account")
    print("=" * 54)
    print(f"  Plaid environment : {ENV_NAME.upper()}")
    print()

    if not os.path.exists(CONFIG_PATH):
        print(f"ERROR: plaid_config.json not found in:\n  {SCRIPT_DIR}")
        print("Copy the PLAID_ACCOUNTS value from Apps Script (Project Settings →")
        print("Script Properties) into a plaid_config.json of the form:")
        print('  {"accounts": [ ...that array... ]}')
        input("\nPress ENTER to exit...")
        sys.exit(1)

    with open(CONFIG_PATH) as f:
        accounts = json.load(f).get('accounts', [])

    if not accounts:
        print("No accounts found in plaid_config.json. Run plaid_setup.py first.")
        input("\nPress ENTER to exit...")
        sys.exit(1)

    print("Which account needs re-linking?")
    for i, a in enumerate(accounts, 1):
        print(f"  {i}. {a['name']}  ({a.get('institution', '')})")
    choice = input(f"\nEnter a number [1-{len(accounts)}] (default 1): ").strip() or '1'
    try:
        account = accounts[int(choice) - 1]
    except (ValueError, IndexError):
        print("Invalid choice.")
        input("\nPress ENTER to exit...")
        sys.exit(1)

    _access_token['value'] = account['access_token']
    print(f"\n  Re-linking: {account['name']}")
    print("  Opening browser... log in to your bank there.")

    server = HTTPServer(('localhost', PORT), RelinkHandler)
    webbrowser.open(f'http://localhost:{PORT}')
    server.serve_forever()

    print()
    if _state['error']:
        print("  Re-link failed — see the error above.")
    elif _state['done']:
        print(f"  ✓  {account['name']} re-linked. The existing access token is valid again.")
        print("  No Apps Script changes needed — run 'Update Account Balances Only' to confirm.")
    else:
        print("  Browser closed before finishing. Nothing changed.")
    print()
    input("Press ENTER to exit...")


if __name__ == '__main__':
    main()
