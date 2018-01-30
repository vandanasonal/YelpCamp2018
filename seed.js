var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data = [
      {
        name: "Salmon Creek Ranch in Bodega Bay, California",
        image: "https://www.mensjournal.com/wp-content/uploads/salmon-creek-59f151e1-c673-4544-9f16-bd1cd3358ec8.png?w=800",
        description: "Only a 45-minute drive from wine country and two short miles from the California coast, this 400-acre cattle ranch offers three separate and private campsites to pitch your tent among the redwoods. Keep in mind that during the winter months, you'll only be able to make it here with four-wheel-drive vehicles. "
      },
      {
         name: "River's Edge in Lumberland, New York",
         image: "https://www.mensjournal.com/wp-content/uploads/30_hall_tow_path_pond_eddy_002-84d5a9cc-18fb-4796-bfae-fab5fe236c7c.jpg?w=800",
         description: "This campsite is tucked away and steps from the Delaware River, known for its renowned fishing. It’s also the perfect riverside spot to throw in a line, go for a paddle, and kick back. Don't forget to bring a pair of water shoes when camping near a river; here are some of our favorites for a variety of activities."
          
      },
      {
          name: "Camp Nylen by Joshua Tree, California",
          image: "https://www.mensjournal.com/wp-content/uploads/camp-nylen-2-522bef00-d962-4059-a28e-3c9971f8f714.jpg?w=800",
          description: "This is an awesome group camp spot right outside of Joshua Tree, so you and the whole crew can camp even when Joshua Tree permits have been sold out for months. The camp itself is surrounded by undeveloped private and public land, so the mountain biking and hiking access on the surrounding dirt roads and Black Lava Butte almost guarantees no crowds. Also worth hitting up is Intersection Rock, located roughly in the center of the major features of Joshua Tree park. It's got plenty of trails nearby, and you'll also have a very good chance of seeing some climbers in action — or get in on the action yourself."
      }
    ];

function seedDB(){
    //Remove all campgrounds
    Campground.remove({},function(err){
        if(err){
            console.log(err);
            
        }else{
            console.log("Campgrounds removed");
            // add few campgrounds
                data.forEach(function(seed){
                    Campground.create(seed,function(err,campground){
                        if(err){
                            console.log(err);
                        }else{
                            console.log("Added a campground");
                            Comment.create(
                                {
                                text : "This place is great!! but i wish there was Internet",
                                author: "Homer"
                            },function(err,comment){
                                if(err){
                                    console.log(err);
                                }else{
                                    campground.comments.push(comment._id);
                                    campground.save();
                                    console.log("Added a comment");
                                }
                            }
                            );
                        }
                    });
                });
        }    
    });
 
}
module.exports = seedDB;