#!/bin/bash
set -e

# Provisioning for the app-tier golden AMI. Installs the runtime the app tier
# needs (Node.js 22, pm2, git) system-wide so it is on PATH at boot for the Auto
# Scaling Group's user-data script.

echo "Updating packages..."
sudo dnf update -y

echo "Installing git..."
sudo dnf install -y git
curl -fsSL -o /tmp/nodesource_setup.sh https://rpm.nodesource.com/setup_22.x
sudo bash /tmp/nodesource_setup.sh
rm -f /tmp/nodesource_setup.sh
sudo dnf install -y nodejs

echo "Installing pm2 process manager..."
sudo npm install -g pm2

echo "Verifying installs..."
node -v
npm -v
node -e 'if (!process.versions.node.startsWith("22.")) process.exit(1)'
pm2 -v

echo "App AMI provisioning complete."
