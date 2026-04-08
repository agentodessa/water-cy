#!/bin/sh
set -e

# Install bun
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Install dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH"
bun install --frozen-lockfile
