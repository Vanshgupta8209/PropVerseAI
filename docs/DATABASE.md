# Database Schema & Architecture Documentation — PropVerse AI

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ PROPERTIES : "owns"
    USERS ||--o{ BOOKMARKS : "saves"
    USERS ||--o{ REVIEWS : "writes"
    USERS ||--o{ REFRESH_TOKENS : "has"
    USERS ||--o{ MESSAGES : "sends"
    
    PROPERTIES ||--o{ PROPERTY_IMAGES : "contains"
    PROPERTIES ||--o{ PROPERTY_AMENITIES : "has"
    PROPERTIES ||--o{ REVIEWS : "receives"
    PROPERTIES ||--o{ BOOKMARKS : "bookmarked_in"

    AMENITIES ||--o{ PROPERTY_AMENITIES : "linked_to"
    CONVERSATIONS ||--o{ MESSAGES : "holds"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        enum role "buyer|seller|builder|agent|admin"
        boolean is_active
        boolean is_verified
        string full_name
        timestamp created_at
    }

    PROPERTIES {
        uuid id PK
        uuid owner_id FK
        string title
        string slug UK
        enum property_type "apartment|house|villa|plot|commercial|penthouse|studio|farmhouse"
        enum listing_type "sale|rent|lease"
        enum status "draft|pending|active|sold|rented|inactive"
        numeric price
        numeric price_per_sqft
        float area_sqft
        int bedrooms
        int bathrooms
        string city
        string state
        boolean is_verified
        boolean is_featured
    }

    PROPERTY_IMAGES {
        uuid id PK
        uuid property_id FK
        string url
        boolean is_primary
        int order
    }

    AMENITIES {
        uuid id PK
        string name UK
        string category
        string icon
    }

    BOOKMARKS {
        uuid id PK
        uuid user_id FK
        uuid property_id FK
    }

    REVIEWS {
        uuid id PK
        uuid user_id FK
        uuid property_id FK
        int rating
        string comment
    }
```

## 2. Core Database Tables & Descriptions

### `users`
Stores user accounts for buyers, sellers, builders, agents, and admins.
* `id`: UUID (Primary Key)
* `email`: VARCHAR(320) Unique Index
* `role`: Enum (`buyer`, `seller`, `builder`, `agent`, `admin`)
* `is_verified`: BOOLEAN (Email verification state)

### `properties`
Primary catalog of real estate listings.
* `id`: UUID (Primary Key)
* `owner_id`: UUID (FK to `users.id`)
* `price`: NUMERIC(15, 2)
* `city`, `state`: Indexed location attributes for fast search filtering
* `status`: Enum (`active`, `pending`, `sold`, etc.)

### `property_images`
Media assets for each property listing.
* `is_primary`: Main photo thumbnail flag

### `amenities` & `property_amenities`
Normalized amenity matrix (Swimming Pool, Gym, CCTV, Power Backup, etc.).

### `conversations` & `messages`
Real-time chat persistence storing sender IDs, timestamps, and message content.
