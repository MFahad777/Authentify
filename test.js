const { Authentication } = require("./dist/index");

const exp = require("express");

const app = exp();

const auth = new Authentication("AnewSecretToHaveInCommon", "jwt");

const token = auth.generateToken({
    userName:"johnDoe6978594",
    firstName:"John",
    lastName:"Doe",
    email:"john_doe22@gmail.com"
},{
    expiresIn:60000,
});

app.use(auth.authenticate())


app.get("/",(req, res, next) => {

    console.log(req.auth)

    res.send(200);
})

app.listen(3000,() => console.log("LISTENING"))