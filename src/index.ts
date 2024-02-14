import jwt, {
    SignOptions,
    VerifyOptions
} from 'jsonwebtoken';

interface User {
    [key: string]: any;
}

interface VerifyData {
    token?: string,
    isMiddleware: boolean,
    key?: string,
    options?: VerifyOptions
}

export class Authentication {
    private readonly secretKey: string;

    constructor(jwtSecretKey: string) {

        if (!Boolean(jwtSecretKey)) {
            throw new Error("secret key is required");
        }

        this.secretKey = jwtSecretKey;
    }

    generateToken(user: User, options?: SignOptions): string {
        return jwt.sign(user, this.secretKey, options);
    }

    private getBearerToken(token: string) {
        return token?.split("Bearer ")?.[1];
    }

    verifyToken(data: VerifyData): jwt.JwtPayload | Function | string {

        const {
            token,
            key,
            isMiddleware,
            options
        } = data


        if (!isMiddleware && token !== undefined) {
            return jwt.verify(token, this.secretKey, options);
        }

        return (req: any, res: any, next: any) => {

            const token = this.getBearerToken(req.headers[key ?? "Authorization"]);

            if (!Boolean(token)) {
                throw new Error("Bearer Token Is Required");
            }

            req.auth = jwt.verify(token, this.secretKey, options); // set verified data

            next();
        }
    }
}