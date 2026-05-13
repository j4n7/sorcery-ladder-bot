# Sorcery Ladder Bot

Minimal Discord bot for a Sorcery community ladder.

## What this first version includes

- `/report`: report a match without buttons.
- `/confirm`: confirm a pending match by ID.
- `/leaderboard`: competitive ranking.
- `/activity`: activity ranking.
- `/avatar`: ranking for one avatar.
- `/profile`: player profile.
- `/admin-matches`: recent matches.
- `/admin-cancel-match`: cancel a match.
- `/admin-set-competitive`: manually mark a match competitive or non-competitive.
- `/admin-export-csv`: export CSV files.

No `/register` command is needed. Players are created automatically when they report or are mentioned.

## Rules implemented

- Win: 3 points.
- Loss: 1 point.
- Draw: 2 points.
- Weekly competitive match limit per player: configured by `WEEKLY_MATCH_LIMIT`.
- Weekly competitive match limit versus the same opponent: configured by `WEEKLY_OPPONENT_LIMIT`.
- League week: Monday to Sunday, using `Europe/Madrid` by default.
- Matches beyond the limit count for activity but not competitive ranking.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run deploy:commands
npm run dev
```

## Local logic test without Discord

This creates fake players and matches directly in SQLite:

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

## Railway deployment notes

Use the same `.env` variables in Railway. If using SQLite, mount a persistent volume and make sure `DATABASE_URL` points inside it, for example:

```env
DATABASE_URL="file:/data/league.db"
```
