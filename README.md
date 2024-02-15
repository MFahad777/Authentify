# Authentication Package

This package provides utilities for user authentication using JSON Web Tokens (JWT).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Usage](#usage)
- [Simple JWT Authentication](#simple-jwt-authentication)
  - [Creating Instance](#creating-instance)
  - [Verify Token](#verify-token)
- [Authenticate Via Facebook](#authenticate-via-facebook)
  - [Creating Instance](#creating-instance-1)
  - [Creating Routes For Authentication And Callback](#creating-routes-for-authentication-and-callback)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install the package using npm:

```bash
npm install secure-tokenize
```

## Usage

Import the `Authentication` class from the package:

```typescript
const Authentication = require("secure-tokenize");
```

## Simple JWT Authentication

### Creating Instance

Create an instance of the Authentication class by providing the JWT secret key.
```typescript
const auth = new Authentication({
  jwtSecretKey:"jwt_secret_key",
  authMethod:"jwt",
});
```

Generate a JWT token for a user object:

```typescript
const user = { userId: 123, username: 'john_doe' }; // Sample

const token = auth.generateToken(user);
```

### Verify Token

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

## Authenticate Via Facebook

### Creating Instance 

```typescript
const auth = new Authentication({
    jwtSecretKey:"jwt_secret_key",
    authMethod:"facebook",
    facebookAppId:"<facebook_app_id>",
    facebookAppSecret:"<facebook_app_secret_key>",
    url:"http://localhost:3000",
    callbackUrl:"/auth/facebook/callback",
    facebookAPIVersion:"v19.0"
});
```

### Creating Routes For Authentication And Callback

Use the `auth.facebookRedirect` middleware to authenticate user and generate code.

```typescript

// Route for initiating the authentication process
app.get('/auth/facebook', auth.facebookRedirect);
```

Here you will be redirected after successfully signed in. You will get `code` in the query params which you can get and create a JWT token based on the facebook data you get.

```typescript
app.get("/auth/facebook/callback", async (req,res,next) => {

    const token = await auth.generateToken({
        jwt:{
            options:{
                expiresIn:6000
            }
        },
        faceBook:{
            code:req.query.code
        }
    })
    
    res.send(token)
});
```

After that the `authenticate` middleware remains the same.

```typescript
// Middleware
app.use('/protected', auth.authenticate(),(request, response, next) => {
    
    // This will contain user data from facebook
    req.auth;
    
    next()
});
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.