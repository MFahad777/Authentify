# Authentication Package

This package provides utilities for user authentication using JSON Web Tokens (JWT).

## Installation

Install the package using npm:

```bash
npm install secure-tokenize
```

## Usage

Import the `Authentication` class from the package:

```typescript
import { Authentication } from 'secure-tokenize';
```

## Creating Instance

Create an instance of the Authentication class by providing the JWT secret key:

```typescript
const auth = new Authentication('your_jwt_secret_key');
```

## Generate Token

Generate a JWT token for a user object:

```typescript
const user = { userId: 123, username: 'john_doe' }; // Sample

const token = auth.generateToken(user);
```

## Verify Token

Verify a JWT token either directly or as middleware:

```typescript
// Direct verification
const verifiedData = auth.verifyToken({ token: 'your_token', isMiddleware: false });
```
Can also insert it as a middleware in express application by passing isMiddleware set to true

```typescript
const app = require("express")();

// As middleware
app.use('/protected', auth.verifyToken({ isMiddleware: true }),(request, response, next) => {
    
    // This will contain user data 
    req.auth;
    
    next()
});
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.