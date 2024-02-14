import jwt, {
    SignOptions,
    VerifyOptions
} from 'jsonwebtoken';

import {Handler, NextFunction} from "express";

interface User {
    [key: string]: any;
}

interface VerifyData {
    key?: string,
    options?: VerifyOptions,
    req: any
}

interface AuthenticateOptions extends Omit<VerifyData, 'isMiddleware' | 'token' | 'req'> {}

type AuthMethod = "JWT" | "jwt";

export class Authentication {
    private readonly secretKey: string;
    private readonly authMethod: string;

    constructor(jwtSecretKey: string, authMethod : AuthMethod = "jwt") {

        if (!Boolean(jwtSecretKey)) {
            throw new Error("secret key is required");
        }

        this.secretKey = jwtSecretKey;
        this.authMethod = authMethod;
    }

    generateToken(user: User, options?: SignOptions): string {
        return jwt.sign(user, this.secretKey, options);
    }

    private getBearerToken(token: string) {
        return token?.split("Bearer ")?.[1];
    }

    // Only For MiddleWare Purpose
    authenticate(authOptions : AuthenticateOptions = {}) : Function {

        const {
            key = "authorization",
            options = {}
        } = authOptions

        return (req : any, res: Response, next : NextFunction) : any => {

            switch (this.authMethod) {
                case "jwt":
                case "JWT":
                    req.auth = this.verifyToken({
                        key,
                        options,
                        req
                    });
                    next();
                    break;
                default:
                    next()
            }
        }

    }

    private verifyToken(data : VerifyData): any {

        const {
            key,
            options,
            req
        } = data

        const token = this.getBearerToken(req.headers[key ?? "authorization"]);

        if (!Boolean(token)) {
            throw new Error("Bearer Token Is Required");
        }

        return jwt.verify(token, this.secretKey, options); // set verified data
    }
}