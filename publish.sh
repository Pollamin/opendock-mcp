#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./publish.sh <npm-otp-code> [patch|minor|major]"
  exit 1
fi

OTP="$1"
BUMP="${2:-patch}"

# Bump version in package.json (no git tag)
NEW_VERSION=$(npm version "$BUMP" --no-git-tag-version)
NEW_VERSION="${NEW_VERSION#v}"

# Update server.json versions to match
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/g" server.json

echo "Bumped to $NEW_VERSION"

npm publish --access public --otp "$OTP"
mcp-publisher login github
mcp-publisher publish
