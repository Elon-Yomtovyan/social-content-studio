# Social Content Studio

A finished-content publishing workspace for uploading media, adapting copy by
placement, scheduling posts, and connecting social publishing accounts.

## Vercel integration setup

All OAuth callback URLs are derived from the deployed hostname. Configure and
connect accounts from **Settings → Connections** on the permanent production
domain.

### Shared secret

Add one long random value as `SOCIAL_SESSION_SECRET`. It encrypts the Pinterest,
TikTok, and YouTube HttpOnly session cookies. Do not change it after accounts
are connected or the stored sessions will become unreadable.

### Facebook Page

- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_SESSION_SECRET`
- Callback: `/api/facebook/callback`
- Permissions: `pages_show_list`, `pages_read_engagement`,
  `pages_manage_posts`

The connecting Facebook profile must have full control of the selected Page.

### Pinterest

- `PINTEREST_APP_ID`
- `PINTEREST_APP_SECRET`
- `SOCIAL_SESSION_SECRET`
- Callback: `/api/social?provider=pinterest&action=callback`
- Scopes: `user_accounts:read`, `boards:read`, `pins:read`, `pins:write`

Pinterest publishing access is subject to the app's approved API access level.

### TikTok

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `SOCIAL_SESSION_SECRET`
- Callback: `/api/social?provider=tiktok&action=callback`
- Products: Login Kit and Content Posting API
- Scopes: `user.info.basic`, `video.publish`

Unaudited Content Posting API clients can test with private visibility. Public
direct posting requires TikTok approval and audit.

### YouTube

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `SOCIAL_SESSION_SECRET`
- Callback: `/api/social?provider=youtube&action=callback`
- API: YouTube Data API v3
- Scopes: `youtube.readonly`, `youtube.upload`

Use a **Web application** OAuth client. Add test users while the Google OAuth
consent screen is in Testing.
