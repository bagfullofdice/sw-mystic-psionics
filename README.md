# S&W Mystic Psionics

Companion module for Foundry VTT 14 and Swords & Wizardry 4.2.x.

## Features

- Adds a Mystic Psionics panel to the character sheet Spells tab.
- Stores all Mystic information in Foundry actor flags rather than modifying S&W system data.
- Tracks:
  - Psionic Level
  - Current / Maximum PSP
  - Sciences known
  - Devotions known
  - Attack Modes known
  - Defense Modes known
  - Chakra access
- Includes:
  - Spend 1 PSP
  - Recover 1 PSP
  - Full Recover
  - Sync progression from Mystic level
- Uses the PX1 Mystic advancement progression through 20th level.

## Installation

Place the `sw-mystic-psionics` folder into your Foundry `Data/modules` directory,
or upload/install the zip through a hosting service that accepts custom module packages.

Enable **S&W Mystic Psionics** in the world.

## Usage

Open a player character sheet and select the **Spells** tab.

Check **Enable Mystic** to activate the panel for that character.

"Sync From Level" updates:
- Maximum PSP
- Sciences
- Devotions
- Attack Modes
- Defense Modes
- Standard chakra progression

It does not overwrite the current PSP value except to clamp it to the new maximum.

## Design

Mystic information is stored under:

`actor.flags.sw-mystic-psionics.mystic`

This intentionally avoids modifying the Swords & Wizardry actor schema.

## Compatibility note

S&W sheet HTML can change between releases. This version searches for the Spells tab
using several common selectors. If S&W 4.2.1 uses a different selector in a specific
sheet implementation, the injection selector can be adjusted without migrating actor data.
