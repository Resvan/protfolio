# Contact form backend (Google Apps Script)

Free pipeline: form → Google Sheet row → email to you. Optionally a WhatsApp ping via CallMeBot (a third-party hobby service; visitor messages transit their server, so it is off unless you add its properties).

## 1. Create the sheet and script
1. Go to https://sheets.new and name the spreadsheet "resvan.in contact".
2. Extensions → Apps Script. Delete the default code, paste `Code.gs`, save (Ctrl/Cmd+S).
   A sheet tab named `responses` is created on the first submission.

## 2. Optional: get a CallMeBot API key (WhatsApp)
Skip this section to use email + sheet only; the script detects the missing properties and simply doesn't call CallMeBot.
1. Save +34 644 71 81 99 in your phone contacts as "CallMeBot".
2. From WhatsApp send it: `I allow callmebot to send me messages`
3. Within a couple of minutes it replies with your API key. Keep it private.
   (Current instructions: https://www.callmebot.com/blog/free-api-whatsapp-messages/)

## 3. Set Script Properties (optional)
All properties have defaults, so with email + sheet only you can skip this step. In the Apps Script editor: gear icon (Project Settings) → scroll to **Script Properties** → **Add script property**.

| Property | Value |
|---|---|
| `NOTIFY_EMAIL` | `muhammedresvan@gmail.com` (default if unset) |
| `CALLMEBOT_PHONE` | `+916238577673` (only if using CallMeBot) |
| `CALLMEBOT_APIKEY` | the key from step 2 (only if using CallMeBot) |
| `SHEET_ID` | leave unset (script is bound to the sheet) |

Save. Nothing here is ever sent to the browser.

## 4. Deploy as a web app
1. Deploy → New deployment → gear → **Web app**.
2. Description: `contact v1`. Execute as: **Me**. Who has access: **Anyone**.
3. Deploy → authorise with your Google account (Advanced → Go to project if warned) → copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).

## 5. Test it
```bash
# Note: no -X POST. Apps Script answers with a 302 and curl must switch to GET on
# the redirect (as browsers do); -X POST would force POST and return a 405 page.
curl -sL "<WEB_APP_URL>" \
  --data-urlencode name="Test Person" --data-urlencode email="you@example.com" \
  --data-urlencode phone="+31 6 1234 5678" \
  --data-urlencode message="Hello from curl, this is a test." --data-urlencode website=""
# → {"ok":true}
```
Check: a row in `responses` and an email in your inbox (plus a WhatsApp message if CallMeBot is configured).

## 6. Connect the site
- Local: put the URL in `.env` as `PUBLIC_CONTACT_ENDPOINT=…`.
- GitHub: repo Settings → Secrets and variables → Actions → **Variables** → New repository variable `PUBLIC_CONTACT_ENDPOINT` = the URL.

## Changing the script later
Edit `Code.gs` in the editor, then Deploy → **Manage deployments** → pencil → Version: **New version** → Deploy. The URL stays the same.

## Limits
MailApp: ~100 emails/day on a free account. CacheService rate limit: 5 messages per email address per hour.
