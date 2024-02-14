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

Create an instance of the Authentication class by providing the JWT secret key.
Can also select authentication method which is currently set to `jwt` which is default as well.
```typescript
const auth = new Authentication('your_jwt_secret_key',"jwt");
```

## Generate Token

Generate a JWT token for a user object:

```typescript
const user = { userId: 123, username: 'john_doe' }; // Sample

const token = auth.generateToken(user);
```

## Verify Token

Set middleware in express application.

```typescript
const app = require("express")();

// Middleware
app.use('/protected', auth.authenticate(),(request, response, next) => {
    
    // This will contain user data 
    req.auth;
    
    next()
});
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.