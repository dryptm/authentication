//jshint esversion:6
const express=require("express");
const ejs=require("ejs");
const bodyparser=require("body-parser");
const app=express();
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportlocalmongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
require('dotenv').config();


app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({extended:true}));



app.use(session({
    secret:"me is a secret",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

const userschema=new mongoose.Schema({ 
    username: String,
    password:String,
    secret:String
});

userschema.plugin(passportlocalmongoose);
userschema.plugin(findOrCreate);

const user = new mongoose.model('user', userschema);

passport.use(user.createStrategy());
 
passport.serializeUser(function(User, done) {
    console.log("serialized!!!");
    done(null, User.id);
  });
  
  passport.deserializeUser(function(id, done) {
    user.findById(id, function(err, User) {
        console.log("deserialized!!!!");
      done(err, User);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",

  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    user.findOrCreate({ googleId: profile.id }, function (err, User) {
      return cb(err, User);
    });
  }
));



app.get('/auth/google',passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/secrets', passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});
app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
})

app.get("/secrets",function(req,res){
    user.find({"secret" : {$ne:null}},function(err,foundlist){
        if(foundlist){
            res.render("secrets",{mysecrets:foundlist});
        }
        else{
            console.log(err);
        }
    })
})

app.get("/submit",function(req,res){
    if (req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login")  
    }
})



app.post("/submit",function(req,res){
    user.findById(req.user.id,function(err,foundlist){
        if(foundlist){
            foundlist.secret=req.body.secret;
            foundlist.save();
            res.redirect("/secrets")
        }
        else{
            console.log(err)
        }
    })
})
app.post("/register",function(req,res){
    user.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
})
app.post("/login",function(req,res){
    const User =new user({
        username:req.body.username,
        password:req.body.password
    });

    req.login( User,function(err){
        if (err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})


mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
app.listen(3000,function(){
    console.log("server started at 3000")
})
