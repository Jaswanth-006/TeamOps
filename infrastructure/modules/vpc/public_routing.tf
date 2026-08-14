# Internet Gateway — the VPC's door to the public internet.
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "teamops-igw-${var.environment}"
  }
}

# Public route table: send all non-local traffic to the internet gateway. This
# route — and only this route — is what makes the associated subnets "public".
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "teamops-public-rt-${var.environment}"
  }
}

# Associate every public subnet with the public route table.
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
