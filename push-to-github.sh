#!/bin/bash
# ============================================
#  ClipForge → GitHub in one shot
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}  ╔══════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}  ║  ClipForge → GitHub Setup   ║${RESET}"
echo -e "${BOLD}${CYAN}  ╚══════════════════════════════╝${RESET}"
echo ""

# ── Step 1: GitHub username ──────────────────
echo -e "${YELLOW}Step 1/4 — Your GitHub username:${RESET}"
read -p "  > " GH_USER
if [ -z "$GH_USER" ]; then
  echo -e "${RED}Username cannot be empty.${RESET}"; exit 1
fi

# ── Step 2: Repo name ────────────────────────
echo ""
echo -e "${YELLOW}Step 2/4 — Repo name (press Enter for 'clipforge'):${RESET}"
read -p "  > " REPO_NAME
REPO_NAME=${REPO_NAME:-clipforge}

# ── Step 3: Visibility ───────────────────────
echo ""
echo -e "${YELLOW}Step 3/4 — Public or private? (public/private, default: public):${RESET}"
read -p "  > " VISIBILITY
VISIBILITY=${VISIBILITY:-public}

# ── Step 4: Token ────────────────────────────
echo ""
echo -e "${YELLOW}Step 4/4 — GitHub Personal Access Token${RESET}"
echo -e "  ${CYAN}Get one at: https://github.com/settings/tokens/new${RESET}"
echo -e "  Scopes needed: ${BOLD}repo${RESET}"
read -s -p "  Token (hidden): " GH_TOKEN
echo ""

if [ -z "$GH_TOKEN" ]; then
  echo -e "${RED}Token cannot be empty.${RESET}"; exit 1
fi

echo ""
echo -e "  Creating repo ${BOLD}${GH_USER}/${REPO_NAME}${RESET} (${VISIBILITY})..."

# Create the repo via API
HTTP_STATUS=$(curl -s -o /tmp/gh_response.json -w "%{http_code}" \
  -X POST "https://api.github.com/user/repos" \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${REPO_NAME}\",\"private\":$([ \"$VISIBILITY\" = \"private\" ] && echo true || echo false),\"description\":\"🎬 ClipForge — Browser-based video cutting studio\"}")

if [ "$HTTP_STATUS" = "201" ]; then
  echo -e "  ${GREEN}✓ Repo created!${RESET}"
elif [ "$HTTP_STATUS" = "422" ]; then
  echo -e "  ${YELLOW}⚠ Repo already exists — pushing to existing repo.${RESET}"
else
  echo -e "  ${RED}✗ Failed to create repo (HTTP $HTTP_STATUS)${RESET}"
  cat /tmp/gh_response.json
  exit 1
fi

# Init git if needed
if [ ! -d ".git" ]; then
  git init
  echo -e "  ${GREEN}✓ Git initialized${RESET}"
fi

# .gitignore
cat > .gitignore << 'EOF'
node_modules/
.DS_Store
*.local
EOF

git add -A
git commit -m "🎬 Initial commit — ClipForge video cutting studio" 2>/dev/null || \
  git commit --allow-empty -m "🎬 Initial commit — ClipForge video cutting studio"

# Set remote
REMOTE_URL="https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"

git branch -M main
echo -e "  Pushing to GitHub..."
git push -u origin main --force

echo ""
echo -e "${GREEN}${BOLD}  ✅ Done! Your repo is live:${RESET}"
echo -e "  ${CYAN}https://github.com/${GH_USER}/${REPO_NAME}${RESET}"
echo ""
echo -e "  ${BOLD}Deploy to Vercel:${RESET}"
echo -e "  ${CYAN}https://vercel.com/new/import?url=https://github.com/${GH_USER}/${REPO_NAME}${RESET}"
echo ""
echo -e "  ${BOLD}Deploy to Netlify:${RESET}"
echo -e "  ${CYAN}https://app.netlify.com/start/deploy?repository=https://github.com/${GH_USER}/${REPO_NAME}${RESET}"
echo ""
