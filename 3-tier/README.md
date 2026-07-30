# 3-Tier AWS Terraform Project + Packer with VPC and ALB (Modules / Workspace) .tfstate File in S3 Bucket

## For more projects, check out  
[https://harishnshetty.github.io/projects.html](https://harishnshetty.github.io/projects.html)

[![Video Tutorial](https://github.com/harishnshetty/image-data-project/blob/9ae83ecc25bc1e2866e572b2ce4915a931f63b48/3tierterraform.jpg)](https://youtu.be/BgyYqUXuHuk?si=Gi6vkxhnVJQBILkG)

[![Channel Link](https://github.com/harishnshetty/image-data-project/blob/18092a3f383409bf598a67558f62f3a2ac80e9f9/3tieraws-project-statelock-terraform-packer-alb-module-workspace-diagram.jpg)](https://youtu.be/BgyYqUXuHuk?si=Gi6vkxhnVJQBILkG)


---

## Create a Security Group

| SG name      | inbound        | Access         | Description                                  |
|--------------|----------------|---------------|----------------------------------------------|
| Jump Server  | 22             | MY-ip         | access from my laptop                        |
| 1. web-frontend-alb     | 80,         | 0.0.0.0/24    | all access from internet                     |
| 2. Web-srv-sg      | 80,  22    | 1. web-frontend-alb       | only front-alb and jump server access        |
|              |                | jump-server   |                                              |
| 3. app-Internal-alb-sg     |  80,  | 2. Web-srv-sg      | only web-srv                                 |
| 4. app-Srv-sg      | 4000,  22 | 3. app-Internal-alb-sg | only 3. app-Internal-alb-sg and jump server access          |
|              |                | jump-server   |                                              |
| 5. DB-srv       | 3306, 22       | 4. app-Srv-sg       | only app-srv and jump server access          |
|              |      3306          | jump-server   |                                              |

---

## Create a VPC

| #  | Component         | Name                  | CIDR / Details                                |
|----|-------------------|-----------------------|-----------------------------------------------|
| 1  | VPC              | 3-tier-vpc            | 10.75.0.0/16                                  |
| 12 | Subnets          | Public-Subnet-1a      | 10.75.1.0/24                                  |
|    |                  | Public-Subnet-1b      | 10.75.2.0/24                                  |
|    |                  | Public-Subnet-1c      | 10.75.3.0/24                                  |
|    |                  | Web-Private-Subnet-1a | 10.75.4.0/24                                  |
|    |                  | Web-Private-Subnet-1b | 10.75.5.0/24                                  |
|    |                  | Web-Private-Subnet-1c | 10.75.6.0/24                                  |
|    |                  | App-Private-Subnet-1a | 10.75.7.0/24                                  |
|    |                  | App-Private-Subnet-1b | 10.75.8.0/24                                  |
|    |                  | App-Private-Subnet-1c | 10.75.9.0/24                                  |
|    |                  | DB-Private-Subnet-1a  | 10.75.10.0/24                                 |
|    |                  | DB-Private-Subnet-1b  | 10.75.11.0/24                                 |
|    |                  | DB-Private-Subnet-1c  | 10.75.12.0/24                                 |

| #   | Component         | Name/Route Table                | CIDR/Details      | NAT Gateway | Notes                                         |
|-----|-------------------|---------------------------------|-------------------|-------------|-----------------------------------------------|
| 1   | Internet Gateway  | 3-tier-igw                      |                   |             |                                               |
| 3   | Nat gateway       | 3-tier-1a                       |                   |             |                                               |
|     |                   | 3-tier-1b                       |                   |             |                                               |
|     |                   | 3-tier-1c                       |                   |             |                                               |
| 10  | Route-Table       | 3-tier-Public-rt                |                   | nat-gw      |                                               |
|     |                   | 3-tier-web-Private-rt-1a        | 10.75.4.0/24      |       |                                               |
|     |                   | 3-tier-web-Private-rt-1b        | 10.75.5.0/24      |       |                                               |
|     |                   | 3-tier-web-Private-rt-1c        | 10.75.6.0/24      |       |                                               |
|     |                   | 3-tier-app-Private-rt-1a        | 10.75.7.0/24      |       |                                               |
|     |                   | 3-tier-app-Private-rt-1b        | 10.75.8.0/24      |       |                                               |
|     |                   | 3-tier-app-Private-rt-1c        | 10.75.9.0/24      |       |                                               |
|     |                   | 3-tier-db-Private-rt-1a         | 10.75.10.0/24     |       |                                               |
|     |                   | 3-tier-db-Private-rt-1b         | 10.75.11.0/24     |       |                                               |
|     |                   | 3-tier-db-Private-rt-1c         | 10.75.12.0/24     |       |                                               |
 

---

## Steps

- Take one of the EC2 instances in Ubuntu (t2.micro)
- Create this key-pair name only / replace with own keypair name in the Iaac Project

```bash
new-keypair
```

- Install all the application packages:

  - terraform
  - packer
  - aws
  - jq
  - git
  - pyhon3.14

Refer: [Terraform](https://developer.hashicorp.com/terraform/install)

## Terraform and Packer Installation

```bash
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs)" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install -y terraform packer git 
```

## AWS CLI Installation

Refer: [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

```bash
sudo apt install -y unzip jq
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

## AWS CLI Configuration

```bash
aws configure
```
## Checkov Installation for infra scanning
```bash
sudo apt update
sudo apt install python3-pip python3-venv -y
python3.14 -m  venv ~/pip
source ~/pip/bin/activate
pip3 install checkov
```

```bash
checkov -d .
checkov -d . -o json > checkov-report.json
```

---
## mysql command line to add the Database
```bash
mysql -h db-instance-dev.cne0wymoyx30.ap-south-1.rds.amazonaws.com -u admin -p
```
---

## What are the Things I need to Replace if I do it myself

- Github Repo: https://github.com/harishnshetty/3-tier-aws-terraform-packer-statelock-project.git  
  *(because you've changed the bucket-name in the Terraform Project)*

- Update the ACM Tags / SNS Topic ARN / create your own Route53 hosted Zone

- Create S3 Bucket: make sure you give a unique bucket name

- Path:  `terraform init` | `terraform plan` | `terraform apply -auto-approve`

- S3 Bucket Name: `three-tier-terrafrom-s3-8745`  
  *(replace with your new bucket name in all the Terraform files – use the visual search lens for replacement as shown in the video)*

```bash
du -sh * .
```
 

```bash
./destroy.sh
```
## if you found any difficulty to delete the secrets in the secretsmanager delete them

```bash
aws secretsmanager delete-secret --secret-id backend-db-credentials-dev --force-delete-without-recovery --region ap-south-1


aws secretsmanager delete-secret --secret-id backend-db-credentials-stage --force-delete-without-recovery --region us-east-1
```
# "Important: Delete the  AMI and snapshots along with the EBS volume, otherwise I may be charged."

```bash
terraform destroy -var-file="dev.tfvars" -auto-approve
terraform destroy -var-file="stage.tfvars" -auto-approve
terraform destroy -var-file="prod.tfvars" -auto-approve
``` 
[![Video Tutorial](https://github.com/harishnshetty/image-data-project/blob/c757fcf45b14c2ab0a65b0d01633685c191d88ec/Screenshot%20from%202025-09-20%2017-12-11.png)](https://www.youtube.com/@devopsHarishShetty)


## What We Will Learn in This Video

### 1. Core Concepts and Tools
* **Shell Scripting**
* **Packer**
* **Terraform Workspaces**
* **Terraform Modules**
* **Lifecycle Policies**: `prevent_destroy`, `ignore_changes`, `create_before_destroy`, `replace_triggered_by, [not using here]`
* **Meta-Arguments**: `depends_on`, `count`, 
* **Provisioners**: `local-exec [not using here]`, `remote-exec [not using here]` , `file`
* **Terraform Functions, Data Sources, and Filters**
* **Version Locking**: Terraform and Provider version constraints
* **Variables**

### 2. 3-Tier Application Architecture
* **Public Layer**: 3 Public Subnets, 1 External ALB
* **Web Layer**: 3 Web Private Subnets, 1 Internal ALB
* **App Layer**: 3 App Private Subnets, 1 Internal ALB
* **Database Layer**: 3 DB Private Subnets, RDS Endpoint

### 3. Security and Advanced Features
* **Secrets Management**: Retrieving credentials with AWS Secrets Manager
* **Auto Scaling & Monitoring**: SNS notifications for ASG scale-up/scale-down and stress testing
* **Networking**: Route53 and ACM Certification
* **Security**: Security Groups (SG)
* **Compliance Scanning**: Checkov for Infrastructure Scanning

### 4. Stress Testing Commands
To verify auto-scaling, we will use the `stress` tool:

```bash
sudo yum install -y stress
stress --cpu $(nproc) --timeout 300
```

## Useful Commands (Project Specific Reference)

ncdu
### Workspace Management
```bash
terraform init
terraform workspace list

# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Select workspace
terraform workspace select dev
terraform workspace show
```

### Auto Scaling Configuration

### AMI Lookup (AWS CLI)
**Get latest AL2023 Image ID (Text Output):**
```bash
aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" \
            "Name=state,Values=available" \
  --query 'Images | sort_by(@, &CreationDate)[-1].ImageId' \
  --output text
```

**Get latest AL2023 Image Details (Table Output):**
```bash
aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" \
  --query 'Images | sort_by(@, &CreationDate)[-1].[ImageId,Name,CreationDate]' \
  --output table
```

### Setup Scripts
```bash
chmod +x setup.sh
```

### ACM Certificate Data Source Configuration
```hcl
data "aws_acm_certificate" "selected" {
  statuses    = ["ISSUED"]
  most_recent = true

  tags = {
    Domain = "harishshetty"
    Name   = "harishshetty"
  }
}
```

### Deployment Commands
**Plan & Apply (Dev):**
```bash
tf plan -var-file="dev.tfvars"
terraform apply -var-file="dev.tfvars" -auto-approve
```

### Server Access & Database Connection
**SSH into EC2 (Dev):**
```bash
ssh -i "new-keypair.pem" ec2-user@ec2-3-6-88-181.ap-south-1.compute.amazonaws.com
```

**Copy Keypair to EC2 (Dev):**
```bash
scp -i "new-keypair.pem" new-keypair.pem ec2-user@ec2-3-6-88-181.ap-south-1.compute.amazonaws.com:/home/ec2-user
```

**Connect to RDS from EC2 (Dev):**
```bash
mysql -h db-instance-dev.cne0wymoyx30.ap-south-1.rds.amazonaws.com -u admin -p
```

**SSH & SCP (US Region / Staging):**
```bash
ssh -i "us-new-keypair.pem" ec2-user@ec2-100-24-35-30.compute-1.amazonaws.com
scp -i "us-new-keypair.pem" us-new-keypair.pem ec2-user@ec2-100-24-35-30.compute-1.amazonaws.com:/home/ec2-user
```

**Connect to Staging RDS:**
```bash
mysql -h db-instance-staging.ce3iwawsm9az.us-east-1.rds.amazonaws.com:3306 -u admin -p
```

### Stress Testing
```bash
sudo yum install -y stress htop
stress --cpu $(nproc) --timeout 300
```



