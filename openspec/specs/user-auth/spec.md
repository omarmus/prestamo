# User Auth Specification

## Purpose

Specify the identity and authentication bounded context: user registration, local login with email and password, JWT token lifecycle, and profile access.

## Requirements

### Requirement: User Registration

The system MUST allow registering a user with `email`, `password`, `name`, and `phone`. Password MUST be hashed with argon2id before storage. On success, the system MUST return an access token (JWT, 15 min) and a refresh token (opaque, 7 days). The user MUST be assigned role `USER` by default. The duplicate email check MUST use `findByEmail`, which excludes soft-deleted records, allowing re-registration of previously soft-deleted accounts.

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

### Requirement: Email and Phone Validation

The system MUST validate email format (RFC 5322 pattern). The system MUST validate phone format for Bolivia: `+591 6XXXXXXXX` or `+591XXXXXXXX` with optional dashes/spaces. Invalid formats MUST return `400 Bad Request` with a descriptive error.

#### Scenario: Invalid email format

- GIVEN a registration request with email `not-an-email`
- WHEN `POST /api/auth/register` is called
- THEN the response is `400 Bad Request` indicating invalid email

#### Scenario: Invalid phone format

- GIVEN a registration request with phone `123`
- WHEN `POST /api/auth/register` is called
- THEN the response is `400 Bad Request` indicating invalid phone

### Requirement: Local Login

The system MUST authenticate users via email and password. On success, it MUST return new access and refresh tokens. On failure, the attempt MUST be logged with timestamp and source IP. Soft-deleted users MUST be rejected with `401 Unauthorized`.

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

### Requirement: Token Refresh

The system MUST accept a valid refresh token at `POST /api/auth/refresh` and return a new access token and a new refresh token (rotation). The old refresh token MUST be invalidated. A reused refresh token MUST revoke all tokens in the family.

#### Scenario: Successful token refresh

- GIVEN a valid refresh token
- WHEN `POST /api/auth/refresh` is called with it
- THEN a new `accessToken` and `refreshToken` are returned
- AND the old token is invalidated

#### Scenario: Reused token triggers family revocation

- GIVEN a refresh token that has already been consumed
- WHEN `POST /api/auth/refresh` is called with it again
- THEN the response is `401 Unauthorized`
- AND all refresh tokens for that user are revoked

### Requirement: Profile Query

The system MUST expose `GET /api/auth/me` authenticated via Bearer JWT. It MUST return `id`, `email`, `name`, `phone`, `role`, `organizationId`, and `createdAt`. Expired or invalid tokens MUST return `401 Unauthorized`. If the user has been soft-deleted since token issuance, the profile query MUST also return `401 Unauthorized`.

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
