#!/bin/bash
set -e

echo "Destroying Terraform infrastructure..."
terraform destroy -var-file="dev.tfvars" -auto-approve
