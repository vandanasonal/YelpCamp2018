var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//**********************
// COMMENT ROUTE
//**********************

router.get("/campground/:id/comments/new", middleware.isLoggedIn ,function(req, res) {
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        }else {
           res.render("comments/new", {campground:campground});
        }
    });
    
});
//create comment
router.post("/campground/:id/comments", middleware.isLoggedIn ,function(req,res){
    //lookup campground using id
    Campground.findById(req.params.id,function(err, campground) {
        if(err){
           console.log(err);
            res.redirect("/campground");
        }else{
            Comment.create(req.body.comment,function(err,comment){
                if(err){
                    req.flash("error","Something went wrong");
                    console.log(err);
                }else{
                    //add username and id to the comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    
                    campground.comments.push(comment._id);
                    campground.save();
                    console.log(comment);
                    req.flash("success","Successfully added comment");
                    res.redirect("/campground/" + campground._id);
                }
            })
        }
    })
})

//EDIT
router.get("/campground/:id/comments/:comment_id/edit",middleware.checkCommentOwnership, function(req,res){
   Campground.findById(req.params.id, function(err,foundCampground){
       if(err || !foundCampground){
           req.flash("error","No campground found");
           return res.redirect("back");
       }
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error","Comment not found")
                res.redirect("back");
            }else{
                res.render("comments/edit",{campground_id: req.params.id ,comment: foundComment});
            }
        });
    });
  });
       

// UPDATE
router.put("/campground/:id/comments/:comment_id", middleware.checkCommentOwnership ,function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err,updatedComments){
        if(err){
            res.redirect("back");
        }else{
            res.redirect("/campground/" + req.params.id);
        }
    })
});

//DELETE
router.delete("/campground/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req,res){
    
    Comment.findByIdAndRemove(req.params.comment_id,function(err){
        if(err){
           res.redirect("back");
        }else{
            req.flash("success","Comment deleted!");
            res.redirect("/campground/" + req.params.id);
        }
    })
})





module.exports = router;