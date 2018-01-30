var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
//mongoose.Promise = global.Promise;
var passport = require("passport");
var localStrategy = require("passport-local");
var methodOverride = require("method-override");
var passportLocalMongoose = require("passport-local-mongoose");
var Campground = require("./models/campground");
var seedDB = require("./seed");
var Comment = require("./models/comment");
var User = require("./models/user");
var flash = require("connect-flash");
require('dotenv').config();

app.locals.moment = require('moment');

var commentRoutes   = require("./routes/comments"),
    campgroundRoutes= require("./routes/campgrounds"),
    indexRoutes     = require("./routes/index");

//seedDB();

var url= process.env.DATABASEURL || "mongodb://localhost/yelp_camp_v12";
mongoose.connect(url);
//mongoose.connect("mongodb://localhost/yelp_camp_v12"); 


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "YelpCamp, a campground booking site",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success")
    next();
});

app.use(indexRoutes);
app.use(campgroundRoutes);
app.use(commentRoutes);


app.listen(process.env.PORT,process.env.IP,function(){
	console.log("YelpCamp server Has Started");
});