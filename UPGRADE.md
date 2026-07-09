# Upgrade notes

This version does not require a database migration. Existing players, matches, seasons and the fixed leaderboard message ID remain compatible.

## Required environment changes

Add or update these values in the deployment environment:

```env
LEADERBOARD_MIN_MATCHES=5
AVATAR_MIN_MATCHES=5
AVATAR_MIN_WIN_RATE=50
```

`AVATAR_MIN_MATCHES` was previously set to 3 in the original project, so it must be changed explicitly if the existing deployment keeps its current environment variables.

## Deployment

```bash
npm install
npm run prisma:generate
npm run build
npm run deploy:commands
```

Restart the bot and run:

```text
/admin-setup-status
/admin-refresh-leaderboard
```

The report, confirmation and match storage systems are unchanged.
