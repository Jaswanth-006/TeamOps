#!/bin/bash
set -e

if [ -z "$AWS_REGION" ]; then
  echo "Error: AWS_REGION is not set. Please export AWS_REGION."
  exit 1
fi
AMI_FILE="../ami_ids/backend_ami.txt"
mkdir -p ../ami_ids
LOG_FILE="packer_build.log"

packer init .
AMI_ID=$(packer build -machine-readable -var aws_region=$AWS_REGION backend.pkr.hcl | tee /dev/tty | awk -F, '$0 ~/artifact,0,id/ {print $6}' | cut -d: -f2)

if [ -n "$AMI_ID" ]; then
  echo "Backend AMI created: $AMI_ID"
  echo -n "$AMI_ID" > $AMI_FILE
else
  echo "Failed to build backend AMI"
  exit 1
fi
