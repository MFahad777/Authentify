import jwt, {SignOptions, VerifyOptions} from 'jsonwebtoken';

import { Response, Request, NextFunction} from "express";

import axios from "axios";

interface User {
    [key: string]: any;
}

interface VerifyData {
    key?: string,
    options?: VerifyOptions,
    req: any
}

interface InitOptions {
    jwtSecretKey : string,
    authMethod : AuthMethod,
    facebookAppId? : string,
    facebookAppSecret? : string
    url?: string,
    callbackUrl?: string,
    facebookAPIVersion?: string
}

interface FaceBookOptions {
    fields: string
}

interface GenerateTokenOptions {
    user : User,
    jwt: {
        options: SignOptions
    },
    faceBook:{
        options: FaceBookOptions,
        code: string
    }
}

interface AuthenticateOptions extends Omit<VerifyData, 'req'> {}

type AuthMethod = "JWT" | "jwt" | "facebook" | "FACEBOOK";

export class Authentication {
    private readonly secretKey: string;
    private readonly authMethod: string;
    private readonly url: string | undefined;
    private readonly facebookAppSecret: string | undefined;
    private readonly facebookAppId: string | undefined;
    private readonly callbackUrl: string | undefined;
    private readonly facebookAPIVersion: string | unknown;

    constructor(options: InitOptions) {

        if (!Boolean(options.jwtSecretKey)) {
            throw new Error("secret key is required");
        }

        this.secretKey = options.jwtSecretKey;
        this.authMethod = options.authMethod;
        this.url = options.url;
        this.facebookAppSecret = options.facebookAppSecret;
        this.facebookAppId = options.facebookAppId;
        this.callbackUrl = options?.callbackUrl ?? "/auth/facebook/callback";
        this.facebookAPIVersion = options.facebookAPIVersion ?? "v19.0";
    }

    async generateToken(generateTokenOptions: GenerateTokenOptions): Promise<string> {

        const jwtOptions = generateTokenOptions?.jwt?.options;

        const faceBookOptions = generateTokenOptions?.faceBook?.options;

        const user = generateTokenOptions?.user;

        const code = generateTokenOptions?.faceBook?.code;

        switch (this.authMethod) {
            case "jwt":
            case "JWT":
                return jwt.sign(user, this.secretKey, jwtOptions)
            case "facebook":
            case "FACEBOOK":
                const userData = await this.handleFacebookAuthentication(code,faceBookOptions);
                return jwt.sign(userData, this.secretKey, jwtOptions);
            default:
                throw new Error(`${this.authMethod} is not accepted`);
        }
    }

    private getBearerToken(token: string) {
        return token?.split("Bearer ")?.[1];
    }

    // Only For MiddleWare Purpose
    authenticate(authOptions: AuthenticateOptions = {}): (req: any, res: Response, next: NextFunction) => any {

        const {
            key,
            options,
        } = authOptions

        return (req : any, res: Response, next : NextFunction) : any => {
            req.auth = this.verifyToken({
                key,
                options,
                req
            });
            next();
        }

    }

    facebookRedirect(req: Request, res: Response, next : NextFunction) : void {

        const fbAPIUrl = `https://www.facebook.com/${this.facebookAPIVersion}/dialog/oauth?client_id=${this.facebookAppId}&redirect_uri=${this.url}${this.callbackUrl}`;

        return res.redirect(fbAPIUrl);
    }

    private async handleFacebookAuthentication(code : string, faceBookOptions : FaceBookOptions): Promise<string> {
        try {
            if (!code) {
                throw new Error(`FaceBook is not provided`);
            }

            const scope = faceBookOptions?.fields ?? "id,name,email";

            const tokenResponse = await axios.get(
                `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${this.facebookAppId}&redirect_uri=${this.url}${this.callbackUrl}&client_secret=${this.facebookAppSecret}&code=${code}`
            );

            const accessToken = tokenResponse.data.access_token;

            const userResponse = await axios.get(
                `https://graph.facebook.com/me?fields=${scope}&access_token=${accessToken}`
            );

            return userResponse.data;
        } catch (error) {
            throw error
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