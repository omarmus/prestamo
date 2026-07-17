# Delta for User Auth

## MODIFIED Requirements

### Requirement: User Registration

The system MUST allow registering a user with `email`, `password`, `name`, and `phone`. Password MUST be hashed with argon2id before storage. On success, the system MUST return an access token (JWT, 15 min) and a refresh token (opaque, 7 days). The user MUST be assigned role `USER` by default. The system MUST automatically create a Customer record linked 1:1 to the new User upon successful registration, copying `name` and `phone` from the User record. The duplicate email check MUST use `findByEmail`, which excludes soft-deleted records, allowing re-registration of previously soft-deleted accounts.
(Previously: no automatic Customer creation)

#### Scenario: Successful registration with Customer creation (updated)

- GIVEN valid `email`, `password` (8+ chars), `name`, and Bolivian `phone`
- WHEN `POST /api/auth/register` is called
- THEN a user is created with hashed password and role `USER`
- AND a Customer record is created with the same `name` and `phone`
- AND the response contains `accessToken` and `refreshToken`

#### Scenario: Duplicate email rejected (unchanged)

- GIVEN an ACTIVE user with email `a@b.com` (NOT soft-deleted)
- WHEN `POST /api/auth/register` is called with that email
- THEN the response is `409 Conflict`

#### Scenario: Soft-deleted email allows re-registration (updated)

- GIVEN a user with email `a@b.com` was soft-deleted (`deletedAt` is set)
- WHEN `POST /api/auth/register` is called with that email
- THEN registration succeeds (`findByEmail` returns null for soft-deleted)
- AND a new user record is created with a new ID
- AND a new Customer record is created linked to the new user

#### Scenario: Customer creation failure rolls back (new)

- GIVEN a valid registration request
- WHEN Customer creation fails (e.g. DB constraint violation)
- THEN the entire registration is rolled back (user is not created)
- AND the response is `500 Internal Server Error`
