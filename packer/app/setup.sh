#!/bin/bash
set -e

# Provisioning for the app-tier golden AMI. Installs the runtime the app tier
# needs (Node 22, pm2, git) system-wide so it is on PATH at boot for the Auto
# Scaling Group's user-data script.

echo "Updating packages..."
sudo dnf update -y

echo "Installing git and Node.js..."
sudo dnf install -y git nodejs npm

echo "Installing pm2 process manager..."
sudo npm install -g pm2

echo "Verifying installs..."
node -v
npm -v
pm2 -v

echo "App AMI provisioning complete."
