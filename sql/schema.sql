CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    region_name VARCHAR(255) NOT NULL,
    region_code VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS storeys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    storey_min INT NOT NULL,
    storey_max INT NOT NULL
);

CREATE TABLE IF NOT EXISTS flat_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flat_type_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS flat_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flat_model_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS towns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    town_name VARCHAR(255) NOT NULL,
    town_code VARCHAR(10) NOT NULL,
    region_id INT,
    FOREIGN KEY (region_id) REFERENCES regions(id)
);

CREATE TABLE IF NOT EXISTS properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `block` VARCHAR(255) NOT NULL,
    street_name VARCHAR(255) NOT NULL,
    floor_area_sqm DECIMAL(10, 2) NOT NULL,
    lease_commence_year INT NOT NULL,
    town_id INT,
    storey_id INT,
    flat_type_id INT,
    flat_model_id INT,
    FOREIGN KEY (town_id) REFERENCES towns(id),
    FOREIGN KEY (storey_id) REFERENCES storeys(id),
    FOREIGN KEY (flat_type_id) REFERENCES flat_types(id),
    FOREIGN KEY (flat_model_id) REFERENCES flat_models(id)
);

CREATE TABLE IF NOT EXISTS resale_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_month DATE NOT NULL,
    resale_price DECIMAL(15, 2) NOT NULL,
    user_id INT,
    property_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    town_id INT,
    FOREIGN KEY (town_id) REFERENCES towns(id)
);

CREATE TABLE IF NOT EXISTS parks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    park_name VARCHAR(255) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    town_id INT,
    FOREIGN KEY (town_id) REFERENCES towns(id)
);

CREATE TABLE IF NOT EXISTS gyms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gym_name VARCHAR(255) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    street_name VARCHAR(255) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    town_id INT,
    FOREIGN KEY (town_id) REFERENCES towns(id)
);

CREATE TABLE IF NOT EXISTS saved_properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    property_id INT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE TABLE IF NOT EXISTS price_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    flat_type_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mongodb_ref VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (flat_type_id) REFERENCES flat_types(id)
);

CREATE TABLE IF NOT EXISTS alert_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT,
    transaction_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payload JSON NOT NULL,
    FOREIGN KEY (alert_id) REFERENCES price_alerts(id),
    FOREIGN KEY (transaction_id) REFERENCES resale_transactions(id)
);
