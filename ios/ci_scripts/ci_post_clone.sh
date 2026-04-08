#!/bin/sh
set -e

echo ">>> Installing Node.js via nvm"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22

echo ">>> Installing bun"
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

echo ">>> Installing cmake (required by Hermes)"
brew install cmake

echo ">>> Installing dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH"
bun install --frozen-lockfile

echo ">>> Installing CocoaPods"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
