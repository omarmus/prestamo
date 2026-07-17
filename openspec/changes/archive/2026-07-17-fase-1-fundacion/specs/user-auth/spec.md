# Delta for User Auth

## ADDED Requirements

### Requirement: Base Fields on User and Role

The system MUST include `organizationId` (nullable), `deletedAt` (nullable DateTime), `deletedById` (nullable), `version` (Int, default 1), `createdById`, and `updatedById` on the `User` model. The `Role` model SHOULD include the same fields. All auth-related queries (`findByEmail`, `findById`) MUST exclude soft-deleted records (WHERE `deletedAt IS NULL`).

#### Scenario: findByEmail excludes soft-deleted users

- GIVEN a user with email `a@b.com` who has `deletedAt` set
- WHEN `findByEmail("a@b.com")` is called
- THEN the result is `null`

#### Scenario: findById excludes soft-deleted users

- GIVEN a user with `id = 42` who has `deletedAt` set
- WHEN `findById(42)` is called
- THEN the result is `null`

## MODIFIED Requirements

### Requirement: User Registration

The system MUST allow registering a user with `email`, `password`, `name`, and `phone`. Password MUST be hashed with argon2id before storage. On success, the system MUST return an access token (JWT, 15 min) and a refresh token (opaque, 7 days). The user MUST be assigned role `USER` by default. The duplicate email check MUST use `findByEmail`, which excludes soft-deleted records, allowing re-registration of previously soft-deleted accounts.
(Previously: no mention of soft-delete in duplicate email check)

#### Scenario: Successful registration

- GIVEN valid `email`, `password` (8+ chars), `name`, and Bolivian `phone`
- WHEN `POST /api/auth/register` is called
- THEN a user is created with hashed password and role `USER`
- AND the response contains `accessToken` and `refreshToken`

#### Scenario: Duplicate email rejected

- GIVEN an ACTIVE user with email `a@b.com` (NOT soft-deleted)
- WHEN `POST /api/auth/register` is called with that email
- THEN the response is `409 Conflict`

#### Scenario: Soft-deleted email allows re-registration

- GIVEN a user with email `a@b.com` was soft-deleted (`deletedAt` is set)
- WHEN `POST /api/auth/register` is called with that email
- THEN registration succeeds (`findByEmail` returns null for soft-deleted)
- AND a new user record is created with a new ID

### Requirement: Local Login

The system MUST authenticate users via email and password. On success, it MUST return new access and refresh tokens. On failure, the attempt MUST be logged with timestamp and source IP. Soft-deleted users MUST be rejected with `401 Unauthorized`.
(Previously: no mention of soft-delete in login flow)

#### Scenario: Successful login

- GIVEN a user registered with email `a@b.com` and password `valid-pass`
- WHEN `POST /api/auth/login` is called with those credentials
- THEN the response contains a valid `accessToken` and `refreshToken`

#### Scenario: Wrong password

- GIVEN a registered user with email `a@b.com`
- WHEN login is attempted with a wrong password
- THEN the response is `401 Unauthorized` (generic message, no user enumeration)
- AND the failed attempt is logged with timestamp

#### Scenario: Soft-deleted user login rejected

- GIVEN a registered user whose account has been soft-deleted
- WHEN login is attempted with correct credentials
- THEN the response is `401 Unauthorized`
- AND the failed attempt is logged with timestamp

### Requirement: Profile Query

The system MUST expose `GET /api/auth/me` authenticated via Bearer JWT. It MUST return `id`, `email`, `name`, `phone`, `role`, `organizationId`, and `createdAt`. Expired or invalid tokens MUST return `401 Unauthorized`. If the user has been soft-deleted since token issuance, the profile query MUST also return `401 Unauthorized`.
(Previously: no mention of `organizationId` or soft-delete in profile query)

#### Scenario: Authenticated profile request

- GIVEN a valid JWT for user `a@b.com`
- WHEN `GET /api/auth/me` is called with `Authorization: Bearer <token>`
- THEN the response includes `id`, `email`, `name`, `phone`, `role`, `organizationId`, `createdAt`

#### Scenario: Expired token rejected

- GIVEN an expired JWT
- WHEN `GET /api/auth/me` is called with it
- THEN the response is `401 Unauthorized` indicating token expiry

#### Scenario: Soft-deleted user profile rejected

- GIVEN a valid JWT for a user who has been soft-deleted after token issuance
- WHEN `GET /api/auth/me` is called
- THEN the response is `401 Unauthorized`
