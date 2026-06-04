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
    region_code VARCHAR(10) NOT NULL,
    UNIQUE KEY uq_regions_region_name (region_name),
    UNIQUE KEY uq_regions_region_code (region_code)
);

CREATE TABLE IF NOT EXISTS storeys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    storey_min INT NOT NULL,
    storey_max INT NOT NULL
);

CREATE TABLE IF NOT EXISTS flat_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flat_type_name VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_flat_types_name (flat_type_name)
);

CREATE TABLE IF NOT EXISTS flat_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flat_model_name VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_flat_models_name (flat_model_name)
);

CREATE TABLE IF NOT EXISTS towns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    town_name VARCHAR(255) NOT NULL,
    town_code VARCHAR(10) NOT NULL,
    region_id INT,
    UNIQUE KEY uq_towns_name (town_name),
    UNIQUE KEY uq_towns_code (town_code),
    KEY idx_towns_region_id (region_id),
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
    UNIQUE KEY uq_properties_profile (
        `block`,
        street_name,
        floor_area_sqm,
        lease_commence_year,
        town_id,
        storey_id,
        flat_type_id,
        flat_model_id
    ),
    KEY idx_properties_town_id (town_id),
    KEY idx_properties_storey_id (storey_id),
    KEY idx_properties_flat_type_id (flat_type_id),
    KEY idx_properties_flat_model_id (flat_model_id),
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
    KEY idx_resale_transactions_user_id (user_id),
    KEY idx_resale_transactions_property_id (property_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    town_id INT,
    KEY idx_schools_town_id (town_id),
    FOREIGN KEY (town_id) REFERENCES towns(id)
);

CREATE TABLE IF NOT EXISTS parks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    park_name VARCHAR(255) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    town_id INT,
    UNIQUE KEY uq_parks_name (park_name),
    KEY idx_parks_town_id (town_id),
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
    UNIQUE KEY uq_gyms_name (gym_name),
    KEY idx_gyms_town_id (town_id),
    FOREIGN KEY (town_id) REFERENCES towns(id)
);

CREATE TABLE IF NOT EXISTS saved_properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    property_id INT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_saved_properties_user_property (user_id, property_id),
    KEY idx_saved_properties_user_id (user_id),
    KEY idx_saved_properties_property_id (property_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE TABLE IF NOT EXISTS price_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    -- flat_type_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mongodb_ref VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_price_alerts_user_type_ref (user_id, mongodb_ref),
    KEY idx_price_alerts_user_id (user_id),
    -- KEY idx_price_alerts_flat_type_id (flat_type_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
    -- FOREIGN KEY (flat_type_id) REFERENCES flat_types(id)
);

CREATE TABLE IF NOT EXISTS alert_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT,
    transaction_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_alert_notifications_alert_transaction (alert_id, transaction_id),
    KEY idx_alert_notifications_alert_id (alert_id),
    KEY idx_alert_notifications_transaction_id (transaction_id),
    FOREIGN KEY (alert_id) REFERENCES price_alerts(id),
    FOREIGN KEY (transaction_id) REFERENCES resale_transactions(id)
);
