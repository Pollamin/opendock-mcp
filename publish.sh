#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./publish.sh <npm-otp-code> [patch|minor|major]"
  exit 1
fi

# Abort if working directory is not clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: git working directory is not clean. Commit or stash changes first."
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

TOKEN_FILE="$(dirname "$0")/.github_token"
if [ ! -f "$TOKEN_FILE" ]; then
  echo "Error: $TOKEN_FILE not found. Create it and fill it with your GitHub token."
  exit 1
fi
GITHUB_TOKEN="$(cat "$TOKEN_FILE" | tr -d '[:space:]')"

npm login
npm publish --access public --otp "$OTP"
mcp-publisher login github --token $GITHUB_TOKEN
mcp-publisher publish

# Commit and push the version bump
git add package.json package-lock.json server.json
git commit -m "Bump to $NEW_VERSION"
git push
