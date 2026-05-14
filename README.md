# Sorcery Ladder Bot

Minimal Discord bot for a Sorcery community ladder.

## What this version includes

- `/report`: report a match without buttons.
- `/confirm`: confirm a pending match by ID.
- `/reject`: reject a pending match by ID.
- `/leaderboard`: competitive ranking.
- `/activity`: activity ranking.
- `/avatar`: ranking for one avatar.
- `/profile`: player profile.
- `/admin-matches`: recent matches.
- `/admin-cancel-match`: cancel a match.
- `/admin-set-competitive`: manually mark a match competitive or non-competitive.
- `/admin-export-csv`: export CSV files.
- `/admin-seasons`: list seasons.
- `/admin-new-season`: create and activate a new season.
- `/admin-activate-season`: activate an existing season.
- `/admin-close-season`: close the active season.
- `/admin-setup-status`: show current configuration.
- `/admin-refresh-leaderboard`: create or refresh the fixed leaderboard message.

No `/register` command is needed. Players are created automatically when they report or are mentioned.

## Rules implemented

- Win: 3 points.
- Loss: 1 point.
- Draw: 2 points.
- Weekly competitive match limit per player: configured by `WEEKLY_MATCH_LIMIT`.
- Weekly competitive match limit versus the same opponent: configured by `WEEKLY_OPPONENT_LIMIT`.
- League week: Monday to Sunday, using `Europe/Madrid` by default.
- Matches beyond the limit count for activity but not competitive ranking.
- Matches are assigned automatically to the currently active season.

## Admin permissions

Admin commands are controlled by `ADMIN_USER_IDS`.

Example:

```env
ADMIN_USER_IDS=123456789012345678,987654321098765432
```

If `ADMIN_USER_IDS` is empty, admin commands fall back to users with Discord's **Manage Server** permission.

## League name

The public fixed leaderboard title can be configured with:

```env
LEAGUE_NAME="Sorcery Hispanic Ladder"
```

## Channel IDs

The bot can be configured with Discord channel IDs:

```env
INFO_CHANNEL_ID=
REPORTS_CHANNEL_ID=
LEADERBOARD_CHANNEL_ID=
ERRORS_CHANNEL_ID=
```

`REPORTS_CHANNEL_ID` is enforced. If it is set, `/report` can only be used in that channel.

`LEADERBOARD_CHANNEL_ID` is used by `/admin-refresh-leaderboard` and by the automatic leaderboard refresh after confirmed matches.

To copy a channel ID, enable Discord Developer Mode and right-click the channel.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run deploy:commands
npm run dev
```

## First season

After deploying commands and starting the bot, create the first active season:

```text
/admin-new-season name:"May 2026" start_date:"2026-05-01" end_date:"2026-05-31"
```

Check setup:

```text
/admin-setup-status
```

Create or refresh the fixed leaderboard message:

```text
/admin-refresh-leaderboard
```

## Local logic test without Discord

This creates a test season, fake players and matches directly in SQLite:

```bash
npm run test:logic
```

Then open the database visually:

```bash
npm run prisma:studio
```

## Discord setup summary

1. Create an app in the Discord Developer Portal.
2. Create a bot user and copy the token into `.env`.
3. Enable the bot permissions needed for slash commands and sending messages.
4. Invite the bot to your server.
5. Fill `DISCORD_CLIENT_ID` and `DISCORD_GUILD_ID` in `.env`.
6. Run `npm run deploy:commands`.
7. Run `npm run dev`.
8. Create the first season with `/admin-new-season`.

## Railway deployment notes

Use the same `.env` variables in Railway. If using SQLite, mount a persistent volume and make sure `DATABASE_URL` points inside it, for example:

```env
DATABASE_URL="file:/data/league.db"
```
