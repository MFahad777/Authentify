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
- [Authentication Via Google](#authentication-via-google)
  - [Creating Instance](#creating-instance-2)
  - [Setting Up Routes](#setting-up-routes)
  - [Getting Authenticated Data](#getting-authenticated-data)
- [Others](#others)
  - [Custom Function When Using `auth.authenticate()`.](#custom-function-when-using-authauthenticate)
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

const token = auth.generateToken({
  user,
  jwt:{
     options:{
         expiresIn:6000
     } 
  }
});
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
app.get('/auth/facebook', auth.facebookRedirect.bind(auth));
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

## Authentication Via Google

### Creating Instance

You can authenticate user via google by doing some minimal changes if required.

```typescript
const auth = new Authentication({
    jwtSecretKey:"AveryMuchSecretThatNoOneCanHack",
    authMethod:"google",
    googleAppClientId:"<GOOGLE_APP_CLIENT_ID>",
    googleClientSecret:"<GOOGLE_CLIENT_SECRET>",
    googleRedirectURL:"http://localhost:3000/auth/google/callback"
});
```

### Setting Up Routes

These routes facilitate Google authentication, redirecting user to Google's login page and handling the callback to generate a token for authenticated user.

```typescript
// Route for initiating the authentication process
app.get('/auth/google', auth.googleRedirect.bind(auth));

app.get("/auth/google/callback", async (req,res,next) => {

    const token = await auth.generateToken({
        jwt:{
            options:{
                expiresIn:6000
            }
        },
        google:{
            code: req.query.code
        }
    })

    res.send(token)

});
```

### Getting Authenticated Data


This route mandates authentication via `auth.authenticate()` middleware and returns authenticated user data from Google in JSON format.

```typescript
app.get("/protectedRoute",auth.authenticate(),(req, res, next) => {

    // This will contain user data returned from google
    res.json({
        data: req.auth
    });
})
```

The above will give the access token and bearer token for the user. You can get user specific details like emails, names etc by using the below method if needed.
The first param is `access_token` and the second param is `personFields`

Available `personFields` can be found on this link [personFields](https://developers.google.com/people/api/rest/v1/people/get)

```typescript
app.get("/protectedRoute",auth.authenticate(), async (req, res, next) => {

    // This will contain user data returned from google
    const accessToken = req.auth.access_token;
    
    const user = await auth.getGoogleUserProfile(accessToken,"names,addresses");
    
    res.status(200).send();
})
```

## Others

### Custom Function When Using `auth.authenticate()`.

```typescript

// In result you will get the verified data from the token.

const customFn = function (result) {
  return {
    keyToSetAgainst:"userData", // this will be the key set to request object. (Required)
    data:{                      // Modified data along with the verified data. (Optional)
      ...result,
      timeStamp: new Date()
    }
  }
}

app.get("/protectedRoute",auth.authenticate({customFn}),(req, res, next) => {
  res.json(req.userData);
})

```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.