#!/bin/bash
# Sync files FROM preview working directory TO git repository
# Usage: bash scripts/sync-from-preview.sh

GIT_REPO="/home/z/godot-learning-app"
PREVIEW_DIR="/home/z/my-project"

if [ ! -d "$GIT_REPO" ]; then
  echo "Error: Git repo not found at $GIT_REPO"
  echo "Cloning..."
  cd /home/z
  git clone https://github.com/Angelionix/Godot_Learning.git godot-learning-app
fi

echo "Syncing from preview directory → git repo..."

rsync -av --delete \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='db/' \
  --exclude='.git/' \
  --exclude='.env.local' \
  "$PREVIEW_DIR/" "$GIT_REPO/"

echo "Done! Changes are in $GIT_REPO"
echo "Run: cd $GIT_REPO && git add . && git commit -m 'sync: from preview' && git push origin main"
