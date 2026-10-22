#!/bin/bash
set -e

# Provisioning for the web-tier golden AMI. Installs the runtime the web tier
# needs (nginx, Node.js 22, git) system-wide so it is on PATH at boot for the
# Auto Scaling Group's user-data script.

echo "Updating packages..."
sudo dnf update -y

echo "Installing nginx and git..."
sudo dnf install -y nginx git
curl -fsSL -o /tmp/nodesource_setup.sh https://rpm.nodesource.com/setup_22.x
sudo bash /tmp/nodesource_setup.sh
rm -f /tmp/nodesource_setup.sh
sudo dnf install -y nodejs

echo "Enabling nginx to start on boot..."
sudo systemctl enable nginx

echo "Verifying installs..."
node -v
npm -v
node -e 'if (!process.versions.node.startsWith("22.")) process.exit(1)'
nginx -v

echo "Web AMI provisioning complete."
