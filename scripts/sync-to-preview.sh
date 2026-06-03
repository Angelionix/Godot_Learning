#!/bin/bash
# Sync files FROM git repository TO preview working directory
# Usage: bash scripts/sync-to-preview.sh

GIT_REPO="/home/z/godot-learning-app"
PREVIEW_DIR="/home/z/my-project"

if [ ! -d "$GIT_REPO" ]; then
  echo "Error: Git repo not found at $GIT_REPO"
  exit 1
fi

echo "Syncing from git repo → preview directory..."

rsync -av --delete \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='db/' \
  --exclude='.git/' \
  --exclude='.env.local' \
  "$GIT_REPO/" "$PREVIEW_DIR/"

echo "Done! Run 'npm install && npx next build' in preview directory."
