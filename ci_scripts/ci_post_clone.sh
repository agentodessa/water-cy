#!/bin/sh
set -e

# Install dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci
