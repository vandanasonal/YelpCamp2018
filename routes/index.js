var express = require("express");
var router = express.Router();
var User = require("../models/user");
var passport = require("passport");
var Campground = require("../models/campground");
var middleware = require("../middleware");

var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//ROUTES


router.get("/",function(req,res){
	res.render("landing");
});




//AUTHENTICATION ROUTES

//show sign up form
router.get("/register",function(req,res){
    res.render("register");
});

//handling sign up logic
router.post("/register",function(req,res){
    var newUser = new User(
        {
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            avatar: req.body.avatar
            
        });
    if(req.body.adminCode === process.env.ADMINCODE){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err,user){
        if(err){
          if(err.name === 'MongoError' && err.code === 11000){
            //Duplicate email
            req.flash("error","The email has already been registered");
            return res.redirect("register");
           }
          // Some other error
           req.flash("error", "Something went wrong...");
           return res.redirect("/register");
        }
        passport.authenticate("local")(req,res, function(){
            req.flash("success","Nice to meet you " + user.username + "!");
            res.redirect("/campground");
        })
    })
})

//show login form
router.get("/login",function(req,res){
    res.render("login");
});

//handling login logic
router.post("/login", passport.authenticate("local",
{
  successRedirect: "/campground" ,
  failureRedirect: "/login",
  failureFlash: true
}), function(req,res){
    
});

// login logic: app.post("/login", middleware, callback)
// router.post("/login", function(req, res, next)  {
//   passport.authenticate("local", function(err, user, info) {
//     if (err) { return next(err); }
//     if (!user) {
//       req.flash("error", "Invalid username or password");
//       return res.redirect("/login");
//     }
//     req.logIn(user, err=> {
//       if (err) { return next(err); }
//       let redirectTo = req.session.redirectTo ? req.session.redirectTo : '/campgrounds';
//       delete req.session.redirectTo;
//       req.flash("success", "Good to see you again, " + user.username);
//       res.redirect(redirectTo);
//     });
//   })(req, res, next);
// });

//logout
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged you out");
    res.redirect("/campground");
});
// forgot password
router.get("/forgot",function(req,res){
    res.render("forgot");
});

//send confirmation mail
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (err) throw err;
        if (!user) {
         req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 1800000; // 30 minutes

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: "Gmail", 
        auth: {
          user: "yelpcamp2018@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'yelpcamp2018@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
         'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// reset password
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (err) throw err;
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

//update password
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
       if (err) throw err;
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            if (err) throw err;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              if (err) throw err;
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: "yelpcamp2018@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: "yelpcamp2018@gmail.com",
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
      if (err) throw err;
    res.redirect("/campground");
  });
});


// User Profile
router.get("/users/:user_id",function(req, res) {
    User.findById(req.params.user_id, function(err, foundUser){
        if(err || !foundUser){
            req.flash("error","Something went wrong! Please try again.");
            res.redirect("back");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function(err,campgrounds){
            if(err){
                req.flash("error","Something went wrong!");
                res.redirect("back");
            }
            res.render("users/show", {user: foundUser, campgrounds: campgrounds});
        });
        
    });
});


// show user edit form
router.get("/users/:user_id/edit", middleware.checkUserOwnership, function(req, res){
  User.findById(req.params.user_id,function (err, foundUser){
    if (err){ 
        console.log(err);
        return res.redirect("back"); 
    }
     res.render("users/edit", { user: foundUser }); 
  });
});

// update user profile
router.put("/users/:user_id", middleware.checkUserOwnership, function(req, res) {
  User.findByIdAndUpdate(req.params.user_id, req.body.user, function(err, updatedUser){
    if (err) {
      req.flash("error", "Something went wrong...");
      return res.redirect("/users" + req.params.user_id);
    }
    if (updatedUser._id.equals(req.user._id)) {
      res.redirect("/users/" + req.params.user_id);
    } 
  });
});


module.exports = router;
