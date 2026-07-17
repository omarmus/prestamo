# System Configuration Specification

## Purpose

Specify the key-value configuration store for runtime settings and feature flags that can be updated without redeploying the application.

## Requirements

### Requirement: Configuration Storage

The system MUST provide a `system_configurations` table with columns: `key` (string, primary key), `value` (JSON), `description` (nullable string), `updatedById` (string), and `updatedAt` (timestamp). Each entry MUST be uniquely identified by its `key`.

#### Scenario: Configuration is upserted by key

- GIVEN no existing entry for key `"loan.max_amount"`
- WHEN the system stores `{ key: "loan.max_amount", value: 50000 }`
- THEN a new row is inserted with the given key and value

- GIVEN an existing entry for key `"loan.max_amount"` with value `50000`
- WHEN the system stores `{ key: "loan.max_amount", value: 100000 }`
- THEN the existing row is updated (value, `updatedAt`, `updatedById`)
- AND no duplicate row is created

### Requirement: Read Configuration

The system MUST expose a typed configuration reader that accepts a key and an optional default value. If the key does not exist and a default is provided, the system MUST return the default. If neither exists nor default is given, the system MUST raise a `ConfigurationNotFoundError`.

#### Scenario: Read existing value

- GIVEN `"loan.max_amount" = 50000` in the database
- WHEN the system reads `"loan.max_amount"`
- THEN it returns the JSON value `50000`

#### Scenario: Read missing key with fallback default

- GIVEN no entry for `"new_feature.enabled"`
- WHEN the system reads it with default `false`
- THEN it returns `false` without error

#### Scenario: Read missing key without default fails

- GIVEN no entry for `"nonexistent.key"`
- WHEN the system reads it without a default
- THEN it raises `ConfigurationNotFoundError`

### Requirement: Write Configuration

The system SHOULD expose a write API restricted to admin users. The API MUST accept `key`, `value`, and optional `description`. The `value` field MUST be valid JSON. On success, the system MUST update `updatedById` and `updatedAt`.

#### Scenario: Admin writes valid configuration

- GIVEN an authenticated admin user
- WHEN they call the write API with valid JSON value
- THEN the configuration is stored (insert or update)
- AND `updatedById` and `updatedAt` are recorded

#### Scenario: Invalid JSON is rejected

- GIVEN a write request with malformed JSON (e.g., unquoted string)
- WHEN the API validates the payload
- THEN the response is `400 Bad Request`
- AND no row is inserted or updated

### Requirement: Caching

The system SHOULD cache configuration values in-memory to avoid database reads on every access. The cache MUST be invalidated for a specific key when that key is written. The cache MAY expire entries after a configurable TTL.

#### Scenario: Cache returns value without DB query

- GIVEN a configuration was recently read and cached
- WHEN the system reads the same key again
- THEN the value is served from cache
- AND no database query is executed

#### Scenario: Write invalidates cache for that key

- GIVEN `"feature_x.enabled" = true` is cached
- WHEN an admin writes `"feature_x.enabled" = false`
- THEN the cache entry for `"feature_x.enabled"` is invalidated
- AND the next read fetches from the database and re-caches the new value
