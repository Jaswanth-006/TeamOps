#!/bin/bash
set -e

if [ -z "$AWS_REGION" ]; then
  echo "Error: AWS_REGION is not set. Please export AWS_REGION."
  exit 1
fi
AMI_FILE="../ami_ids/frontend_ami.txt"
mkdir -p ../ami_ids

packer init .
AMI_ID=$(packer build -machine-readable -var aws_region=$AWS_REGION frontend.pkr.hcl | tee /dev/tty | awk -F, '$0 ~/artifact,0,id/ {print $6}' | cut -d: -f2)

if [ -n "$AMI_ID" ]; then
  echo "Frontend AMI created: $AMI_ID"
  echo -n "$AMI_ID" > $AMI_FILE
else
  echo "Failed to build frontend AMI"
  exit 1
fi
