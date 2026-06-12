def init_tables(cursor):
    cursor.execute("START TRANSACTION")
    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id UUID NOT NULL DEFAULT (uuid_v7()) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(320) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('ADMIN', 'AGENT', 'USER') NOT NULL DEFAULT 'USER',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS towns (
                id UUID NOT NULL DEFAULT (uuid_v7()) PRIMARY KEY,
                region ENUM(
                    'NORTH REGION',
                    'NORTH-EAST REGION',
                    'EAST REGION',
                    'WEST REGION',
                    'CENTRAL REGION'
                ),
                name VARCHAR(100) NOT NULL UNIQUE
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS amenity_types (
                id SMALLINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS flat_types (
                id SMALLINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS flat_models (
                id SMALLINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS storey_ranges (
                id SMALLINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                min_storey INT NOT NULL,
                max_storey INT NOT NULL,
                CONSTRAINT chk_storey_ranges CHECK (min_storey <= max_storey),
                UNIQUE (min_storey, max_storey)
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS properties (
                id UUID NOT NULL DEFAULT (uuid_v7()) PRIMARY KEY,
                town_id UUID NOT NULL,
                block VARCHAR(20) NOT NULL,
                street_name VARCHAR(255) NOT NULL,
                lease_commence_year INT NOT NULL,
                UNIQUE (town_id, block, street_name, lease_commence_year),
                INDEX idx_properties_town_id (town_id),
                CONSTRAINT fk_properties_town
                    FOREIGN KEY (town_id) REFERENCES towns(id)
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS saved_properties (
                id UUID NOT NULL DEFAULT (uuid_v7()) PRIMARY KEY,
                user_id UUID NOT NULL,
                property_id UUID NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, property_id),
                INDEX idx_saved_properties_user_id (user_id),
                INDEX idx_saved_properties_property_id (property_id),
                CONSTRAINT fk_saved_properties_user
                    FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_saved_properties_property
                    FOREIGN KEY (property_id) REFERENCES properties(id)
                    ON DELETE CASCADE
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS amenities (
                id UUID NOT NULL DEFAULT (uuid_v7()) PRIMARY KEY,
                town_id UUID NOT NULL,
                amenity_type_id SMALLINT NOT NULL,
                name VARCHAR(255) NOT NULL,
                street_name VARCHAR(255),
                postal_code VARCHAR(10),
                longitude DECIMAL(10, 7),
                latitude DECIMAL(10, 7),
                INDEX idx_amenities_town_id (town_id),
                INDEX idx_amenities_amenity_type (amenity_type_id),
                CONSTRAINT fk_amenities_town
                    FOREIGN KEY (town_id) REFERENCES towns(id),
                CONSTRAINT fk_amenities_amenity_type
                    FOREIGN KEY (amenity_type_id) REFERENCES amenity_types(id)
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS resale_transactions (
                id UUID NOT NULL DEFAULT (uuid_v7()) PRIMARY KEY,
                uploaded_by_user_id UUID,
                property_id UUID NOT NULL,
                flat_type_id SMALLINT NOT NULL,
                flat_model_id SMALLINT NOT NULL,
                storey_range_id SMALLINT NOT NULL,
                floor_area_sqm DECIMAL(8, 2) NOT NULL,
                transaction_month DATE NOT NULL,
                resale_price DECIMAL(12, 2) NOT NULL,
                INDEX idx_resale_transactions_uploaded_by_user (uploaded_by_user_id),
                INDEX idx_resale_transactions_property_id (property_id),
                INDEX idx_resale_transactions_flat_type_id (flat_type_id),
                INDEX idx_resale_transactions_flat_model_id (flat_model_id),
                INDEX idx_resale_transactions_storey_range_id (storey_range_id),
                CONSTRAINT fk_resale_transactions_uploaded_by_user
                    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
                    ON DELETE SET NULL,
                CONSTRAINT fk_resale_transactions_property
                    FOREIGN KEY (property_id) REFERENCES properties(id),
                CONSTRAINT fk_resale_transactions_flat_type
                    FOREIGN KEY (flat_type_id) REFERENCES flat_types(id),
                CONSTRAINT fk_resale_transactions_flat_model
                    FOREIGN KEY (flat_model_id) REFERENCES flat_models(id),
                CONSTRAINT fk_resale_transactions_storey_range
                    FOREIGN KEY (storey_range_id) REFERENCES storey_ranges(id)
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS alert_notifications (
                id UUID NOT NULL DEFAULT (uuid_v7()) PRIMARY KEY,
                alert_uuid VARCHAR(36) NOT NULL,
                transaction_id UUID NOT NULL,
                read_at TIMESTAMP NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_alert_notifications_transaction_id (transaction_id),
                CONSTRAINT fk_alert_notifications_transaction
                    FOREIGN KEY (transaction_id) REFERENCES resale_transactions(id)
                    ON DELETE CASCADE
            )
            """
        )
    except Exception as e:
        print(f"An error occurred during table creation: {e}")
        cursor.execute("ROLLBACK")
        raise
    finally:
        cursor.execute("COMMIT")


def teardown_tables(cursor):
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    try:
        cursor.execute(
            "DROP TABLE IF EXISTS alert_notifications, resale_transactions, saved_properties, amenities, properties, storey_ranges, flat_models, flat_types, amenity_types, towns, users CASCADE"
        )
    finally:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
