#!/bin/bash
set -e

export AWS_REGION="ap-south-1"
FRONTEND_AMI_NAME="three-tier-frontend"
BACKEND_AMI_NAME="three-tier-backend"

# Function to check if AMI exists
check_ami_exists() {
  local ami_name=$1
  echo "Checking for AMI: $ami_name..."
  local ami_id=$(aws ec2 describe-images \
    --filters "Name=name,Values=$ami_name" "Name=state,Values=available" \
    --query "Images[0].ImageId" \
    --output text \
    --region $AWS_REGION)

  if [ "$ami_id" != "None" ] && [ -n "$ami_id" ]; then
    echo "AMI $ami_name found: $ami_id"
    return 0
  else
    echo "AMI $ami_name not found."
    return 1
  fi
}

# Check and build Frontend AMI
if ! check_ami_exists "$FRONTEND_AMI_NAME"; then
  echo "Building Frontend AMI..."
  cd packer/frontend
  ./build_ami.sh
  cd ../..
else
  echo "Skipping Frontend AMI build."
fi

# Check and build Backend AMI
if ! check_ami_exists "$BACKEND_AMI_NAME"; then
  echo "Building Backend AMI..."
  cd packer/backend
  ./build_ami.sh
  cd ../..
else
  echo "Skipping Backend AMI build."
fi

echo "All AMIs are ready. Proceeding with Terraform..."

# Initialize and Apply Terraform
terraform init
terraform apply -var-file="dev.tfvars" -auto-approve
