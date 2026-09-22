#!/usr/bin/env bash
#
# Build the frontend and deploy it to Cloudflare Pages via Wrangler.
#
# Usage (by default does NOT build — assumes the output dir is already built):
#   ./scripts/deploy_pages.sh            # deploy existing build as-is
#   ./scripts/deploy_pages.sh --build    # build first, then deploy
#
# Auth: `wrangler login` once, or set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
# in .cf-deploy.env (git-ignored). Config overrides also go there:
#   CF_PAGES_PROJECT     Pages project name      (default: auca-mic)
#   CF_PAGES_BRANCH      production branch        (default: main)
#   CF_PAGES_OUTPUT_DIR  build output dir         (default: dist)
#   CF_PAGES_BUILD_CMD   build command            (default: npm run build)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

if [[ -f "${ROOT_DIR}/.cf-deploy.env" ]]; then
  set -a; source "${ROOT_DIR}/.cf-deploy.env"; set +a
fi

DO_BUILD="false"
for arg in "$@"; do
  case "${arg}" in
    --build) DO_BUILD="true" ;;
    *) echo "Unknown argument '${arg}'. Use: [--build]" >&2; exit 1 ;;
  esac
done

BUILD_CMD="${CF_PAGES_BUILD_CMD:-npm run build}"
OUTPUT_DIR="${CF_PAGES_OUTPUT_DIR:-dist}"
PROJECT="${CF_PAGES_PROJECT:-auca-mic}"
BRANCH="${CF_PAGES_BRANCH:-main}"

if command -v wrangler >/dev/null 2>&1; then WRANGLER="wrangler"; else WRANGLER="npx --yes wrangler@latest"; fi

echo "╠ Cloudflare Pages deploy"
echo "  project   : ${PROJECT}   branch: ${BRANCH}"
echo "  directory : ${OUTPUT_DIR}"
echo "  account   : ${CLOUDFLARE_ACCOUNT_ID:-(unset → wrangler login)}"
echo "  api token : $([[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] && echo set || echo 'NOT set → wrangler login')"
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" && -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "⚠ CLOUDFLARE_API_TOKEN set but CLOUDFLARE_ACCOUNT_ID empty — wrangler may pick the wrong account." >&2
fi

if [[ "${DO_BUILD}" == "true" ]]; then
  # Vite bakes VITE_* into the bundle — fail fast if a required one is empty.
  [[ -f "${ROOT_DIR}/.env" ]] && { set -a; source "${ROOT_DIR}/.env"; set +a; }
  missing=()
  for v in VITE_API_BASE_URL VITE_AUTH_DOMAIN; do
    [[ -n "${!v:-}" ]] || missing+=("$v")
  done
  if (( ${#missing[@]} )); then
    echo "✗ Missing build-time vars: ${missing[*]} — set them in ${ROOT_DIR}/.env" >&2; exit 1
  fi
  [[ -d node_modules ]] || npm ci
  echo "╠ Building (${BUILD_CMD})…"
  eval "${BUILD_CMD}"
else
  echo "╠ Skipping build — deploying existing ${OUTPUT_DIR}/ (pass --build to rebuild)"
fi

[[ -d "${OUTPUT_DIR}" ]] || { echo "Build output '${OUTPUT_DIR}' not found. Pass --build." >&2; exit 1; }

echo "╠ Deploying to Cloudflare Pages (${PROJECT})…"
${WRANGLER} pages deploy "${OUTPUT_DIR}" --project-name="${PROJECT}" --branch="${BRANCH}" --commit-dirty=true
echo "╠ Done. First time only — bind the custom domain (once):"
echo "    ${WRANGLER} pages domain add <your-domain> --project-name=${PROJECT}"
