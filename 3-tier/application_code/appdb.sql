-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS webappdb;
USE webappdb;

-- Create table with unique constraint to avoid duplicates
CREATE TABLE IF NOT EXISTS transactions (
    id INT NOT NULL AUTO_INCREMENT,
    amount DECIMAL(10,2),
    description VARCHAR(100),
    PRIMARY KEY (id),
    UNIQUE KEY unique_transaction (amount, description)
);

-- Insert data (duplicates will be ignored)
INSERT IGNORE INTO transactions (amount, description) VALUES
(500, 'bike'),
(400, 'groceries');
