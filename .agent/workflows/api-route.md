---
name: API Route Development
description: Create API endpoints
---

# API Route Development

Guidelines for creating APIs.

## REST API Structure

```
/api/
├── users/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/route.ts     # GET, PUT, DELETE by ID
├── orders/
│   └── route.ts
└── auth/
    ├── login/route.ts
    └── logout/route.ts
```

## Endpoint Template

### Express/Node
```javascript
// GET /api/users
router.get('/users', async (req, res) => {
  try {
    const users = await db.users.findAll();
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users
router.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const user = await db.users.create({ name, email });
    res.status(201).json({ data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});
```

### Python/FastAPI
```python
@app.get("/api/users")
async def get_users():
    users = await db.users.find_all()
    return {"data": users}

@app.post("/api/users", status_code=201)
async def create_user(user: UserCreate):
    new_user = await db.users.create(user.dict())
    return {"data": new_user}
```

### Go
```go
func GetUsers(w http.ResponseWriter, r *http.Request) {
    users, err := db.GetAllUsers()
    if err != nil {
        http.Error(w, "Failed to fetch", 500)
        return
    }
    json.NewEncoder(w).Encode(map[string]interface{}{"data": users})
}
```

## Input Validation

```javascript
function validateUser(body) {
  const errors = [];
  
  if (!body.email) errors.push('Email required');
  if (!body.email.includes('@')) errors.push('Invalid email');
  if (body.name && body.name.length > 100) errors.push('Name too long');
  
  return { valid: errors.length === 0, errors };
}
```

## Error Responses

```javascript
// Consistent format
{
  "error": "Not found",
  "code": "NOT_FOUND",
  "details": ["User with ID x does not exist"]
}

// HTTP Status Codes
// 200 OK - Success
// 201 Created - Resource created
// 400 Bad Request - Validation error
// 401 Unauthorized - Not authenticated
// 403 Forbidden - Not authorized
// 404 Not Found - Resource missing
// 429 Too Many Requests - Rate limited
// 500 Internal Error - Server error
```

## Authentication

```javascript
// Middleware pattern
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

## Rate Limiting

```javascript
const ratelimit = require('express-rate-limit');

const limiter = ratelimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests
});

app.use('/api/', limiter);
```

## API Checklist

- [ ] Proper HTTP methods
- [ ] Input validation
- [ ] Authentication check
- [ ] Authorization check
- [ ] Error handling
- [ ] Rate limiting
- [ ] Logging
- [ ] Documentation
