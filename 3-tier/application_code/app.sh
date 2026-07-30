#!/bin/bash
set -e   # exit on error


# Ensure correct ownership/permissions
sudo chown -R ec2-user:ec2-user /home/ec2-user
sudo chmod -R 755 /home/ec2-user/app_files

# Run as ec2-user so nvm/npm/pm2 are available
su - ec2-user <<'EOF'
# Load nvm environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Explicitly load app environment variables
if [ -f /etc/profile.d/app_env.sh ]; then
    source /etc/profile.d/app_env.sh
fi

cd /home/ec2-user/app_files

# Install dependencies
npm install @aws-sdk/client-secrets-manager mysql2
npm install aws-sdk
npm install
npm audit fix || true   # don’t fail if audit fix has nothing to fix

# Start app with PM2
pm2 start index.js

# Configure PM2 startup (systemd for ec2-user)
pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save
EOF