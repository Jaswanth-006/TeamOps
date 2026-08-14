# Look up the region's availability zones so subnet i lands in AZ i. Spreading
# the tiers across AZs is what lets the architecture survive a single AZ failure.
data "aws_availability_zones" "available" {
  state = "available"
}

# Public subnets — hold the ALB, bastion, and NAT gateway. Instances launched
# here get a public IP.
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "teamops-public-${count.index + 1}-${var.environment}"
    Tier = "public"
  }
}

# Web-tier private subnets — nginx + React build. No public IPs.
resource "aws_subnet" "web" {
  count             = length(var.web_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.web_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "teamops-web-${count.index + 1}-${var.environment}"
    Tier = "web"
  }
}

# App-tier private subnets — Express API and the internal ALB. No public IPs.
resource "aws_subnet" "app" {
  count             = length(var.app_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.app_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "teamops-app-${count.index + 1}-${var.environment}"
    Tier = "app"
  }
}

# Database private subnets — RDS. The most isolated tier; no internet route.
resource "aws_subnet" "db" {
  count             = length(var.db_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.db_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "teamops-db-${count.index + 1}-${var.environment}"
    Tier = "db"
  }
}
