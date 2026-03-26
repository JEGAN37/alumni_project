# API Testing Guide

## Quick Test Sequence

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123","name":"John Doe"}'
```

Expected Response:
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

---

### 2. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

Expected Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "email": "john@example.com"
}
```

**Save this token for subsequent requests!** Replace `TOKEN` below with the actual token.

---

### 3. Create a Private Note
```bash
curl -X POST http://localhost:5000/api/notes/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title":"My First Note",
    "content":"<p>This is my private note</p>",
    "isPublic":false
  }'
```

Expected Response:
```json
{
  "noteId": 1,
  "shareId": "abc-123-def-456",
  "message": "Note created successfully"
}
```

---

### 4. Create a Public Note
```bash
curl -X POST http://localhost:5000/api/notes/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title":"Public Note",
    "content":"<p>Everyone can see this</p>",
    "isPublic":true
  }'
```

---

### 5. Get My Notes
```bash
curl -X GET http://localhost:5000/api/notes/my-notes \
  -H "Authorization: Bearer TOKEN"
```

Expected Response:
```json
[
  {
    "id": 1,
    "title": "My First Note",
    "content": "<p>This is my private note</p>",
    "owner_id": 1,
    "is_public": false,
    "share_id": "abc-123-def-456",
    "created_at": "2025-02-08T10:00:00.000Z",
    "updated_at": "2025-02-08T10:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Public Note",
    "content": "<p>Everyone can see this</p>",
    "owner_id": 1,
    "is_public": true,
    "share_id": "xyz-789-uvw-123",
    "created_at": "2025-02-08T10:05:00.000Z",
    "updated_at": "2025-02-08T10:05:00.000Z"
  }
]
```

---

### 6. Get a Specific Note
```bash
curl -X GET http://localhost:5000/api/notes/1 \
  -H "Authorization: Bearer TOKEN"
```

---

### 7. Update a Note
```bash
curl -X PUT http://localhost:5000/api/notes/update/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title":"Updated Title",
    "content":"<p>Updated content</p>",
    "isPublic":true
  }'
```

Expected Response:
```json
{
  "message": "Note saved successfully"
}
```

---

### 8. Get Public Notes (No Auth Required)
```bash
curl -X GET http://localhost:5000/api/notes/public/all
```

Returns all public notes (up to 50 most recent).

---

### 9. Access Note by Share ID
```bash
curl -X GET "http://localhost:5000/api/notes/share/abc-123-def-456"
```

**For public notes:** No authentication needed
**For private notes:** Must be authenticated as the owner

---

### 10. Register a Second User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123","name":"Jane Doe"}'
```

Expected Response:
```json
{
  "message": "User registered successfully",
  "userId": 2
}
```

---

### 11. Login as Second User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123"}'
```

Save this token as `TOKEN2`.

---

### 12. Share Note with Second User
```bash
curl -X POST http://localhost:5000/api/notes/share/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "sharedWith": 2,
    "isPublic": false
  }'
```

Expected Response:
```json
{
  "message": "Note shared with user"
}
```

---

### 13. View Notes Shared with Me (as User 2)
```bash
curl -X GET http://localhost:5000/api/notes/shared-with-me \
  -H "Authorization: Bearer TOKEN2"
```

Expected Response:
```json
[
  {
    "id": 1,
    "title": "My First Note",
    "content": "<p>This is my private note</p>",
    "owner_id": 1,
    "is_public": false,
    "share_id": "abc-123-def-456",
    "created_at": "2025-02-08T10:00:00.000Z",
    "updated_at": "2025-02-08T10:00:00.000Z"
  }
]
```

---

### 14. Delete a Note
```bash
curl -X DELETE http://localhost:5000/api/notes/1 \
  -H "Authorization: Bearer TOKEN"
```

Expected Response:
```json
{
  "message": "Note deleted successfully"
}
```

---

## Postman Collection (Alternative to curl)

Save this as `postman_collection.json` and import into Postman:

```json
{
  "info": {
    "name": "Notion-like Notes API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"user@example.com\",\"password\":\"password123\",\"name\":\"User Name\"}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"user@example.com\",\"password\":\"password123\"}"
            }
          }
        }
      ]
    },
    {
      "name": "Notes",
      "item": [
        {
          "name": "Create Note",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "url": "{{baseUrl}}/api/notes/create",
            "body": {
              "mode": "raw",
              "raw": "{\"title\":\"Note Title\",\"content\":\"<p>Content</p>\",\"isPublic\":false}"
            }
          }
        },
        {
          "name": "Get My Notes",
          "request": {
            "method": "GET",
            "header": [
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "url": "{{baseUrl}}/api/notes/my-notes"
          }
        },
        {
          "name": "Get Public Notes",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/notes/public/all"
          }
        }
      ]
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:5000"},
    {"key": "token", "value": ""}
  ]
}
```

---

## Troubleshooting

### "MySQL error" on startup
- Ensure MySQL is running
- Verify database credentials in `.env`
- Ensure database `saas_notepad` exists

### "No token provided" error
- Add `Authorization: Bearer TOKEN` header
- Ensure TOKEN is the full JWT from login response

### "Invalid token" error
- Token may have expired (tokens last 7 days)
- Login again to get a new token
- Verify JWT_SECRET matches in `.env`

### Database schema errors
- Run the SQL from `database.sql` file
- Ensure all tables were created successfully

### Port already in use
- Change PORT in `.env`
- Or kill the process using port 5000








eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzcwNTk4OTAxLCJleHAiOjE3NzEyMDM3MDF9.8_lYTXmxy7iojN7anOIf7s0scCApSHoKBYvTnTCtEdc