//jshint esversion:6
const express=require("express");
const ejs=require("ejs");
const bodyparser=require("body-parser");
const app=express();
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportlocalmongoose=require("passport-local-mongoose");

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
    password:String 
});

userschema.plugin(passportlocalmongoose);
const user = new mongoose.model('user', userschema);

passport.use(user.createStrategy());
 
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());


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
    if(req.isAuthenticated){
        res.render("secrets")
    }
    else{
        res.redirect("/login")
    }
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
