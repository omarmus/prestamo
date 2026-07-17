# Delta for User Auth

## ADDED Requirements

### Requirement: WhatsApp Registration

The system MUST allow registering a user from WhatsApp chatbot data using `phone` as the primary identifier. Email MUST be optional (defaults to null). Password MUST be auto-generated as a random opaque string. The user MUST be created with role `CUSTOMER`. If a `whatsapp_contact` exists for the phone, the system MUST link the new user to that contact.

#### Scenario: Registration from chatbot

- GIVEN a completed chatbot registration session with `phone=+59171234567`, `name=Juan Perez`, and no email
- WHEN the system creates the user from chatbot data
- THEN a user is created with phone as unique identifier, auto-generated password, role `CUSTOMER`
- AND the response is the created user ID

#### Scenario: Duplicate phone rejected

- GIVEN an ACTIVE user with phone `+59171234567`
- WHEN a chatbot registration attempts to create a user with that phone
- THEN the system returns an error indicating phone already exists
- AND the chatbot session resumes asking if the user wants to log in

### Requirement: Phone Validation for WhatsApp

The system MUST accept phone numbers in the format received from WhatsApp (`+59171234567`) during registration. No email is required when the phone is provided. The phone MUST be unique across non-deleted users.

#### Scenario: WhatsApp phone format accepted

- GIVEN a registration request with phone `+59171234567` and no email
- WHEN the system processes it
- THEN the user is created successfully
- AND the phone is stored as-is

## MODIFIED Requirements

### Requirement: Email and Phone Validation

The system MUST validate email format (RFC 5322 pattern) when an email is provided. The system MUST validate phone format for Bolivia: `+591XXXXXXXX` with optional dashes/spaces. Email MUST be optional when phone is provided. Invalid formats MUST return `400 Bad Request` with a descriptive error. At least one of email or phone MUST be present.
(Previously: email was required, phone was required)

#### Scenario: Invalid email format (unchanged)

- GIVEN a registration request with email `not-an-email`
- WHEN `POST /api/auth/register` is called
- THEN the response is `400 Bad Request` indicating invalid email

#### Scenario: Missing both email and phone

- GIVEN a registration request with no email and no phone
- WHEN the system processes it
- THEN the response is `400 Bad Request` indicating at least one identifier is required

#### Scenario: Valid phone, no email (new)

- GIVEN a registration request with phone `+59171234567` and no email
- WHEN `POST /api/auth/register` is called
- THEN registration succeeds
