const { Authentication } = require("./dist/index");

const exp = require("express");

const app = exp();

const auth = new Authentication({
    jwtSecretKey:"AveryMuchSecretThatNoOneCanHack",
    authMethod:"facebook",
    facebookAppId:"<app_id>",
    facebookAppSecret:"<secret_id>",
    url:"http://localhost:3000",
    callbackUrl:"",
    facebookAPIVersion:"v19.0"
});

// Route for initiating the authentication process
app.get('/auth/facebook', auth.facebookRedirect);

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

    res.redirect(`/dashboard?token=${token}`)

});

app.get("/dashboard",(req, res, next) => {

    res.send(`
       <h1>${req.query.token}</h1>
    `)

})

app.get("/protectedRoute",auth.authenticate(),(req, res, next) => {

    res.json({
        data: req.auth
    });
})

app.listen(3000,() => console.log("LISTENING"))