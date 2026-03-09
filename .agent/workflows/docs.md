---
name: Documentation Workflow
description: Create and update documentation
---

# Documentation Workflow

Guidelines for maintaining docs.

## Documentation Structure

```
docs/
├── README.md            # Project overview
├── GETTING_STARTED.md   # Setup guide
├── ARCHITECTURE.md      # System design
├── API.md               # API reference
├── DEPLOYMENT.md        # Deployment guide
└── CONTRIBUTING.md      # Contribution guide
```

## When to Update

| Event | Update |
|-------|--------|
| New feature | README, API docs |
| API change | API docs |
| Config change | Setup guide |
| New dependency | README |

## README Template

```markdown
# Project Name

Brief description.

## Features
- Feature 1
- Feature 2

## Tech Stack
- Language/Framework
- Database
- etc.

## Getting Started

### Prerequisites
- Requirement 1
- Requirement 2

### Installation
\`\`\`bash
git clone <repo>
cd <project>
npm install
\`\`\`

### Development
\`\`\`bash
npm run dev
\`\`\`

## Testing
\`\`\`bash
npm test
\`\`\`

## Deployment
See [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License
MIT
```

## API Documentation

```markdown
### `POST /api/users`

Create a new user.

**Auth**: Required

**Request**:
\`\`\`json
{
  "name": "John",
  "email": "john@example.com"
}
\`\`\`

**Response** (201):
\`\`\`json
{
  "data": {
    "id": "uuid",
    "name": "John"
  }
}
\`\`\`

**Errors**:
- `400` - Validation error
- `401` - Not authenticated
```

## Code Documentation

### Functions
```javascript
/**
 * Calculate total with tax.
 * 
 * @param {number} subtotal - Amount before tax
 * @param {number} taxRate - Tax rate (e.g., 0.1 for 10%)
 * @returns {number} Total including tax
 * 
 * @example
 * calculateTotal(100, 0.1) // Returns 110
 */
function calculateTotal(subtotal, taxRate) {
  return subtotal * (1 + taxRate);
}
```

### Python
```python
def calculate_total(subtotal: float, tax_rate: float) -> float:
    """
    Calculate total with tax.
    
    Args:
        subtotal: Amount before tax
        tax_rate: Tax rate (e.g., 0.1 for 10%)
    
    Returns:
        Total including tax
    
    Example:
        >>> calculate_total(100, 0.1)
        110.0
    """
    return subtotal * (1 + tax_rate)
```

## Documentation Checklist

- [ ] README up to date
- [ ] API docs current
- [ ] Code comments added
- [ ] Examples provided
- [ ] Links working
