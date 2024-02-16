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
    facebookAPIVersion?: string,
    googleAppClientId? : string,
    googleClientSecret?: string,
    googleRedirectURL?: string,
    googleAPIVersion?: string
    googleUserFieldsToGet?: string
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
    },
    google : {
        code: string
    }
}

interface AuthenticateOptions extends Omit<VerifyData, 'req'> {}

type AuthMethod = "JWT" | "jwt" | "facebook" | "FACEBOOK" | "google" | "GOOGLE";

export class Authentication {
    private readonly secretKey: string;
    private readonly authMethod: string;
    private readonly url: string | undefined;
    private readonly facebookAppSecret: string | undefined;
    private readonly facebookAppId: string | undefined;
    private readonly callbackUrl: string | undefined;
    private readonly facebookAPIVersion: string | undefined;
    private readonly googleAppClientId : string | undefined;
    private readonly googleClientSecret: string | undefined;
    private readonly googleRedirectURL: string | undefined;
    private readonly googleAPIVersion: string | undefined;
    private readonly googleUserFieldsToGet: string | undefined;

    constructor(options: InitOptions) {

        if (!Boolean(options.jwtSecretKey)) {
            throw new Error("secret key is required");
        }

        this.secretKey = options.jwtSecretKey;
        this.authMethod = options.authMethod;
        this.url = options.url;

        // FaceBook
        this.facebookAppSecret = options.facebookAppSecret;
        this.facebookAppId = options.facebookAppId;
        this.callbackUrl = options?.callbackUrl ?? "/auth/facebook/callback";
        this.facebookAPIVersion = options?.facebookAPIVersion ?? "v19.0";

        // Google
        this.googleAppClientId = options.googleAppClientId;
        this.googleClientSecret = options.googleClientSecret;
        this.googleRedirectURL = options.googleRedirectURL;
        this.googleAPIVersion = options?.googleAPIVersion ?? "v2";
        this.googleUserFieldsToGet = options?.googleUserFieldsToGet ?? "openid email profile";
    }

    async generateToken(generateTokenOptions: GenerateTokenOptions): Promise<string> {

        const jwtOptions = generateTokenOptions?.jwt?.options;

        const faceBookOptions = generateTokenOptions?.faceBook?.options;

        const user = generateTokenOptions?.user;

        const code = generateTokenOptions?.faceBook?.code ?? generateTokenOptions?.google?.code;

        switch (this.authMethod) {
            case "jwt":
            case "JWT":
                return jwt.sign(user, this.secretKey, jwtOptions)
            case "facebook":
            case "FACEBOOK":
                const userData = await this.handleFacebookAuthentication(code,faceBookOptions);
                return jwt.sign(userData, this.secretKey, jwtOptions);
            case "google":
            case "GOOGLE":
                const googleUserData = await this.handleGoogleAuthentication(code);
                return jwt.sign(googleUserData, this.secretKey, jwtOptions);
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

    googleRedirect(req: Request, res: Response, next : NextFunction) : void {

        const params = {
            client_id: this.googleAppClientId,
            redirect_uri: this.googleRedirectURL,
            response_type: 'code',
            scope: this.googleUserFieldsToGet, // Add required scopes
        };

        const url = `https://accounts.google.com/o/oauth2/${this.googleAPIVersion}/auth?client_id=${params.client_id}&redirect_uri=${params.redirect_uri}&response_type=code&scope=${params.scope}`;

        res.redirect(url);
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

    private async handleGoogleAuthentication(code : string) : Promise<string> {

        if (!code) {
            throw new Error(`code is not provided`);
        }

        // Exchange authorization code for access token
        const tokenParams = {
            code,
            client_id: this.googleAppClientId,
            client_secret: this.googleClientSecret,
            redirect_uri: this.googleRedirectURL,
            grant_type: 'authorization_code',
        };

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', tokenParams, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        return tokenResponse.data;
    }

    async getGoogleUserProfile(access_token : string, personFields: string = "names") {
        const userData = await axios.get(`https://people.googleapis.com/v1/people/me?personFields=${personFields}`,
            {
                headers:{
                    Authorization:`Bearer ${access_token}`
                }
            });

        return userData.data;
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