# **Application Description**

Singapore's HDB resale market is an important part of the country's housing landscape, but existing platforms like PropertyGuru and the HDB Resale Portal are primarily designed for facilitating property transactions and provide limited tools for researching and analysing historical resale data. Our project addresses this gap with a database-driven web application that brings together search, analytics and other features for historical HDB transactions. Ultimately, we aim to provide casual users and property agents a better way to explore and understand the HDB resale market.

# **System Architecture**

The frontend serves as the interface through which users interact with the web application. React was chosen as it has a mature developer ecosystem with excellent community support. The shadcn/ui library provides consistent and modern UI components for building the user interface.

The backend layer handles all business logic and ensures that the databases are not directly exposed to the users. By using the Next.js framework, both the backend and frontend are within a single codebase, simplifying development.

MariaDB serves as the relational database and stores structured data such as resale transactions, properties, and towns. MongoDB complements MariaDB by storing dynamic, document-based data like town polygon boundaries, user search logs, and computed statistics.

Lastly, ETL (Extract, Transform, Load) scripts written in Python are used to populate both databases from the raw datasets. Python was chosen as it offers popular data processing libraries such as pandas which are feature rich and efficient.

# **Data**

_USERS_ is where the platform’s identity and access management. The _role_ enum specifies what each user can do in the platform; Admins manage the entire platform, agents upload transaction data and view statistics, and users can explore, analyse and save transactions. _TOWNS_ is the geographical anchor, every property and amenity belongs to a town. _PROPERTIES_ is where the attributes of the HDB blocks are stored, and _SAVED_PROPERTIES_ is used to store properties saved by users. _AMENITIES_ stores the points of interests available and they are classified with the _AMENITY_TYPES reference table_. _FLAT_TYPES_, _FLAT_MODELS_ and _STOREY_RANGES_ decompose the attributes of resale transactions into reference tables, allowing for efficient storage and retrieval. _RESALE_TRANSACTIONS_ table stores all the transactions where each row is a single sale. _ALERT_NOTIFICATIONS_ is a cross database bridge entity that stores a user_id for the recipient, an alert_uuid pointing to the corresponding MongoDB document, and a link to the resale transaction that triggered the alert.

## **Document DB Collections Schema**

| Collection    | Purpose                                                                   | Main Schema Fields                                                           |
| :------------ | :------------------------------------------------------------------------ | :--------------------------------------------------------------------------- |
| alerts        | Saves user alerts, independent data.                                      | \_id, user_id, filters, is_active, created_at, updated_at, last_triggered_at |
| searchHistory | Stores user search activity and identify demand trends, independent data. | \_id, user_id, query, searched_at                                            |
| towns         | Stores summarised data and polygons for towns, derived data.              | \_id, transaction_summary, coordinates, updated_at                           |
| statistics    | Stores pre-computed data for charts and trends, derived data.             | \_id, metric, granularity, time_range, dimensions, series, computed_at       |

The document database stores flexible and nested data, and the above table summarises the main collections that will be created. Independent data are records created directly from user activity on the platform, such as the search log. Derived data are records generated from existing data such as the resale transaction data stored in the relational database.

A document model is suitable because users may provide different filter combinations for alerts and searchHistory, making the data flexible.

## **Datasets**

| Datasets                                                                                                                                                                                                                                     | Used In                                              |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| [HDB Resale Prices](https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view)                                                                                                                                                    | PROPERTIES, RESALE_TRANSACTIONS, and related schemas |
| [Towns](https://data.gov.sg/datasets/d_2cc750190544007400b2cfd5d7f53209/view)                                                                                                                                                                | TOWNS                                                |
| [Schools](https://data.gov.sg/datasets/d_688b934f82c1059ed0a6993d2a829089/view), [Parks](https://data.gov.sg/datasets/d_99b71f5d34cf57a3a592fbfdef1f42b6/view), [Gyms](https://data.gov.sg/datasets/d_b3ae090692ecf632116c9885cfbd3424/view) | AMENITIES                                            |

### **Extract, Transform, Load**

Raw data is fetched programmatically using data.gov.sg’s Dataset API. Relevant columns are fetched and converted into pandas’ dataframes for easier transformation and efficient access. The data is then cleaned by removing duplicates and standardised by replacing invalid values to match the database schema. Finally, transformed data is then inserted into both databases with records/documents organised into normalised tables/collections and linked with foreign key relationships.

# **Functionalities**

**Analytics and trend visualization.** Users can explore aggregated resale prices across towns, flat types and flat models instead of comparing transaction records individually. Statistics such as rolling 12 month averages, price ranking and YoY % change are computed using SQL window functions while triggers update town statistics when data changes. User search logs are recorded for behavioural analytics as well.

**Search and filter.** Users will be able to filter resale transactions by towns, price range, flat type, etc, allowing retrieval of more specific and relevant results. Pagination is done using SQL LIMIT and OFFSET to manage search results displayed per page.

**User Bookmarks.** Users can save properties or towns they are interested in for their own reference with basic CRUD operations supported.

**Amenities listing.** Information about amenities such as schools, parks, gyms within each town is provided, allowing users to evaluate transactions while factoring in the surrounding environment, thus enhancing their decision making.

**User-customisable alerts**. Users can receive in platform notifications when new resale transactions match their configured alerts, keeping users updated without requiring them to monitor all transactions.

**Authentication and roles.** The platform has role-based access control ensuring each user can only access functions that are within their permissions.

### **Implementation Plan**

| Item                                                        | Status      |
| :---------------------------------------------------------- | :---------- |
| High-level Architecture                                     | Done        |
| ER diagram for relational database                          | Done        |
| Document DB collections schema                              | Done        |
| Progress Report                                             | Done        |
| ETL pipeline scripts                                        | Done        |
| Authentication                                              | In Progress |
| CRUD (transactions, towns, amenities, users)                | In Progress |
| Core features (search, dashboard, statistics)               | In Progress |
| Frontend                                                    | Planned     |
| Advanced features (pagination, alerts, chart visualisation) | Planned     |
