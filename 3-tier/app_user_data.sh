#!/bin/bash
set -e

echo "========== Updating system & installing dependencies =========="
dnf update -y
dnf install -y git mysql jq -y   # MySQL client for RDS
dnf install -y nodejs npm

echo "========== Cloning application repository =========="
cd /home/ec2-user
git clone https://github.com/harishnshetty/terraform-project-vpc-alb-modules-workspace.git || true

APP_DIR=/home/ec2-user/terraform-project-vpc-alb-modules-workspace/application_code

echo "========== Setting Environment Variables =========="
cat <<EOF > /etc/profile.d/app_env.sh
export SECRET_NAME="${secret_name}"
export REGION="${region}"
EOF

source /etc/profile.d/app_env.sh


echo "========== Installing Node.js app dependencies =========="
cp -rf /home/ec2-user/terraform-project-vpc-alb-modules-workspace/application_code/app_files  /home/ec2-user
cp -rf /home/ec2-user/terraform-project-vpc-alb-modules-workspace/application_code/app.sh  /home/ec2-user
chmod +x /home/ec2-user/app.sh


echo "========== Running web.sh =========="
sudo /home/ec2-user/app.sh

cd /home/ec2-user/app_files


echo "🎉 App tier setup completed successfully!"
echo "🌐 Server: $(hostname)"
echo "📊 Environment: ${environment}"
echo "🏷️ Project: ${project_name}"
