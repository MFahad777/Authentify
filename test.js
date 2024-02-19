const { Authentication } = require("./dist/index");

const exp = require("express");

const app = exp();

const auth = new Authentication({
    jwtSecretKey:"AveryMuchSecretThatNoOneCanHack",
    authMethod:"jwt",
});

auth.generateToken({
    user:{
        id:1,
        name:"John",
        lastName:"doe"
    },
}).then(console.log)

// // Route for initiating the authentication process
// app.get('/auth/google', auth.googleRedirect.bind(auth));
//
// app.get("/auth/google/callback", async (req,res,next) => {
//
//     const token = await auth.generateToken({
//         jwt:{
//             options:{
//                 expiresIn:6000
//             }
//         },
//         google:{
//             code: req.query.code
//         }
//     })
//
//     res.send(token)
//
// });

// app.get("/dashboard",(req, res, next) => {
//
//     res.send(`
//        <h1>${req.query.token}</h1>
//     `)
//
// })

app.get("/protectedRoute",auth.authenticate({
    customFn: function (result) {
        return {
            keyToSetAgainst:"userData",
            data:{
                ...result,
                timeStamp: new Date()
            }
        }
    },
}),(req, res, next) => {


    res.json(req.userData);

})

app.listen(3000,() => console.log("LISTENING"))