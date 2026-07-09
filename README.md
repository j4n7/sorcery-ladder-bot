# Sorcery Ladder Bot

Discord bot for the Liga Hispana de Sorcery.

## What this version includes

- `/report`: report a match without buttons.
- `/confirm`: confirm a pending match by ID.
- `/reject`: reject a pending match by ID.
- `/leaderboard`: competitive ranking by win rate.
- `/activity`: activity ranking.
- `/avatar`: ranking for one avatar.
- `/profile`: player profile.
- `/set-country`: set a country code, save the flag in the ladder and add it to the server nickname.
- `/remove-country`: remove the country from the ladder and remove the leading flag from the server nickname.
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

## Competitive ranking rules

- The competitive leaderboard is ordered by win rate.
- A player must reach `LEADERBOARD_MIN_MATCHES` competitive matches to qualify for an official position.
- Players below the minimum remain visible as unqualified participants.
- All later competitive matches continue to affect win rate.
- Legacy points are still calculated internally and included in CSV exports, but do not determine the ranking.

## Avatar ranking rules

A player becomes the Best Pilot of an avatar only when both requirements are met:

- At least `AVATAR_MIN_MATCHES` competitive matches with that avatar.
- At least `AVATAR_MIN_WIN_RATE` percent win rate with that avatar.

If no player qualifies, the fixed leaderboard shows the leading provisional player and the missing requirement.

## Match limits

- Weekly competitive match limit per player: configured by `WEEKLY_MATCH_LIMIT`.
- Weekly competitive match limit versus the same opponent: configured by `WEEKLY_OPPONENT_LIMIT`.
- League week: Monday to Sunday, using `Europe/Madrid` by default.
- Matches beyond the limit count for activity but not competitive ranking.
- Matches are assigned automatically to the currently active season.
- Country flags are optional.

## Configuration

Copy `.env.example` to `.env` and configure the values:

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
ADMIN_USER_IDS=
INFO_CHANNEL_ID=
REPORTS_CHANNEL_ID=
LEADERBOARD_CHANNEL_ID=
ERRORS_CHANNEL_ID=
DATABASE_URL="file:./data/league.db"
TIMEZONE="Europe/Madrid"
WEEKLY_MATCH_LIMIT=5
WEEKLY_OPPONENT_LIMIT=2
LEADERBOARD_MIN_MATCHES=5
AVATAR_MIN_MATCHES=5
AVATAR_MIN_WIN_RATE=50
LEAGUE_NAME="Liga Hispana de Sorcery"
```

Changing the qualification minimum only requires changing `LEADERBOARD_MIN_MATCHES` and restarting the bot.

## Admin permissions

Admin commands are controlled by `ADMIN_USER_IDS`.

```env
ADMIN_USER_IDS=123456789012345678,987654321098765432
```

If `ADMIN_USER_IDS` is empty, admin commands fall back to users with Discord's **Manage Server** permission.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run deploy:commands
npm run dev
```

## First season

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

## Validation

Compile the project:

```bash
npm run build
```

Run the ranking logic tests:

```bash
npm run test:logic
```

## Railway deployment notes

Use the same `.env` variables in Railway. If using SQLite, mount a persistent volume and make sure `DATABASE_URL` points inside it, for example:

```env
DATABASE_URL="file:/data/league.db"
```
