# Urchin Blacklist Extension

This extension provides blacklist checking functionality using the Urchin API.

## Commands

- `!view <username>` - Check if a player has any blacklist tags

## Features

- Fetches player blacklist information from Urchin database
- Supports all Urchin tag sources (GAME, MANUAL, CHAT, ME, PARTY)
- Proper error handling for invalid usernames and API issues
- Formatted output showing tag types and reasons

## Configuration

Requires `URCHIN_API_KEY` environment variable to be set.
