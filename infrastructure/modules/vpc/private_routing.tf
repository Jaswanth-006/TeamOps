# NAT gateway — gives the private web and app tiers OUTBOUND-only internet
# (package installs, OS updates) without making them reachable from outside.
# It lives in a public subnet and needs a static Elastic IP.
#
# Note: a single NAT (one AZ) is a cost/HA trade-off. Production would run one
# NAT per AZ; we use one to keep costs down and state that trade-off in the viva.

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "teamops-nat-eip-${var.environment}"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "teamops-nat-${var.environment}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Web + app private route tables: outbound internet via the NAT gateway.
resource "aws_route_table" "web" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "teamops-web-rt-${var.environment}"
  }
}

resource "aws_route_table" "app" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "teamops-app-rt-${var.environment}"
  }
}

# Database route table: NO 0.0.0.0/0 route at all. The db tier has only the
# implicit local (in-VPC) route, so it cannot reach the internet in either
# direction — the strongest isolation in the design.
resource "aws_route_table" "db" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "teamops-db-rt-${var.environment}"
  }
}

resource "aws_route_table_association" "web" {
  count          = length(aws_subnet.web)
  subnet_id      = aws_subnet.web[count.index].id
  route_table_id = aws_route_table.web.id
}

resource "aws_route_table_association" "app" {
  count          = length(aws_subnet.app)
  subnet_id      = aws_subnet.app[count.index].id
  route_table_id = aws_route_table.app.id
}

resource "aws_route_table_association" "db" {
  count          = length(aws_subnet.db)
  subnet_id      = aws_subnet.db[count.index].id
  route_table_id = aws_route_table.db.id
}
