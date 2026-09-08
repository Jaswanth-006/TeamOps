#!/bin/bash
set -e

# Provisioning for the web-tier golden AMI. Installs the runtime the web tier
# needs (nginx, Node 22, git) system-wide so it is on PATH at boot for the
# Auto Scaling Group's user-data script.

echo "Updating packages..."
sudo dnf update -y

echo "Installing nginx, git, and Node.js..."
sudo dnf install -y nginx git nodejs npm

echo "Enabling nginx to start on boot..."
sudo systemctl enable nginx

echo "Verifying installs..."
node -v
npm -v
nginx -v

echo "Web AMI provisioning complete."
