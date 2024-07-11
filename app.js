const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");

// Mongosh connection
const MONGO_URL = "mongodb://127.0.0.1:27017/marriott";
main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine('ejs', ejsMate);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to access this page.");
    res.redirect("/login");
}

// get route 
app.get("/", (req, res) => {
    res.send("hi i am root");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser",async(req,res)=>{
//     let fakeUser = new User({
//         email : "student@gmail.com",
//         username : "student",
//     });
     
//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
//     console.log(registeredUser);
// });


// // index route
app.get("/Alzhemier", (req, res) => {
    res.render("listings/index.ejs");
});

// Detect route accessible only to logged-in users
app.get("/Detect", isLoggedIn, (req, res) => {
    res.redirect("http://192.168.43.132:5000/try-now");
});

// app.post("/Detect",(req,res)=>{
//     res.render("listings/detect.ejs");
// });

// signup
app.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

// signup post 
app.post("/signup", async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.flash("success", "Welcome to Alzhemier Detection!");
        res.redirect("/Alzhemier");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }

});

// get login
app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

//post login
app.post("/login", passport.authenticate("local", { failureRedirect: '/login', failureFlash: true }), async (req, res) => {
    req.flash("success", "Welcome back to Alzhemier detection!");
    res.redirect("/Alzhemier");
});

//logout
app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/Alzhemier");
    })
})

//listening port
app.listen(8080, () => {
    console.log("port is listening to 8080")
});
