#!/usr/bin/env bash
# Create (or recreate) a release tag and push it — triggers the Android build workflow.
# Usage:
#   ./scripts/release.sh            # tag = v<version> from apps/mobile/app.json
#   ./scripts/release.sh v1.2.0     # explicit tag
set -euo pipefail

cd "$(dirname "$0")/.."

TAG="v${1:-}"
if [ -z "$TAG" ]; then
  VERSION="$(node -p "require('./apps/mobile/app.json').expo.version")"
  TAG="v${VERSION}"
fi

echo "==> Release tag: ${TAG}"

# Delete local tag if it exists.
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "==> Removing existing local tag ${TAG}"
  git tag -d "${TAG}"
fi

# Delete remote tag if it exists (ignore error if absent).
if git ls-remote --tags origin "refs/tags/${TAG}" | grep -q "${TAG}"; then
  echo "==> Removing existing remote tag ${TAG}"
  git push origin ":refs/tags/${TAG}"
fi

# Recreate on current HEAD and push.
echo "==> Creating and pushing ${TAG} on $(git rev-parse --short HEAD)"
git tag "${TAG}"
git push origin "${TAG}"

echo "==> Done. Build started: Actions → Android build (AAB)."
