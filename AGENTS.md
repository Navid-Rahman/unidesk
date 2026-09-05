# UniDesk — Project Guidelines

## Rules

- Strictly follow `spec.md` (3 tables: users, tickets, comments). Nothing more than that.
- You should not add any additional tables or fields.- You should not add any additional endpoints or features.
- Do not implement any features that are not explicitly mentioned in the spec.
- Do not build out-of-scope features (no emails, no file uploads).
- Keep test coverage above 70%.
- Do not implement any UI beyond the simple views specified in the spec.
- Do not use any external libraries or frameworks that are not necessary for the core functionality (e.g., no front-end frameworks, no CSS libraries).

## Tech stacks

- **Backend**: Node.js
- **Database**: PostgreSQL
- **Frontend**: React (minimalistic, no additional libraries)

## Testing

- Always write tests for any new functionality.
- Always ensure that the test coverage remains above 70%.
- For each endpoint, write unit tests and integration tests to verify the expected behavior.
- Always test edge cases, such as invalid inputs, unauthorized access, and empty states.
