var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");


var NodeGeocoder = require('node-geocoder');
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GOOGLE_MAPS_API_KEY
};
var geocoder = NodeGeocoder(options);

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: "yelpcamp2018", 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//INDEX- shows all campgrounds

router.get("/campground", function(req, res) {
  var noMatch = "";
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Campground.find({name: regex}, function(err, allCampgrounds) {
      if (err) { console.log(err); }
      else {
        if (allCampgrounds.length < 1) {
          noMatch = "No campgrounds found, please try again.";
        }
        res.render("campgrounds/index", { campground: allCampgrounds, noMatch: noMatch});  
      }
    });
}else{
     //get all the campgrounds from db
     Campground.find({},function(err,allCampgrounds){
          if(err){
               console.log(err);
          }else{
              res.render("campgrounds/index",{ campground : allCampgrounds,noMatch : noMatch }); 
          }
     });
  }
});



 //CREATE -add new campgrounds to DB
router.post("/campground", middleware.isLoggedIn ,upload.single('image'),function(req,res){
 cloudinary.uploader.upload(req.file.path, function(result) {
	//get data from form and add to campground array
	var name = req.body.name;
	var price= req.body.price;
	var image = {
             	// add cloudinary public_id for the image to the campground object under image property
                id: result.public_id,
                // add cloudinary url for the image to the campground object under image property
                url: result.secure_url
                };
	var description = req.body.description;
	var author = {
	              id: req.user._id,
	              username: req.user.username
	}
 

	geocoder.geocode(req.body.location, function (err, data) {
	    if(err){
	        console.log(err);
	    }
    var lat = data[0].latitude
    var lng = data[0].longitude;
    var location = data[0].formattedAddress; 
    
    console.log(data);
    
  	var newCampground = {name, price,image , description , author, location,  lat,  lng};

	//Create a new campground and save to DB
      Campground.create(newCampground,function(err,newlyCreated){
            if(err){
                 console.log(err);
            }else{
              	console.log(newlyCreated);
                 //redirect back to campground page
          	res.redirect("/campground");
            }
         });
     	});   
      });
});



// NEW- show form to create new campground
router.get("/campground/new", middleware.isLoggedIn ,function(req,res){
     res.render("campgrounds/new");
});

//SHOW- shows more info about one campground
router.get("/campground/:id",function(req, res) {
    //find the campground with provided id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error","Campground not found");
            res.redirect("back");
        }else{
              console.log(foundCampground);
            //render show template with that campground
              res.render("campgrounds/show", {campground : foundCampground });
        }
    });
 
});
//EDIT CAMPGROUND ROUTE

// store original image id and url
var imageId, imageUrl;
router.get("/campground/:id/edit",middleware.checkCampgroundOwnership, function (req,res){
    Campground.findById(req.params.id,function(err,foundCampground){
        imageId = foundCampground.image.id;
        imageUrl = foundCampground.image.url;
        if(err){
            console.log(err);
            res.redirect("/campground");
        }else{
             res.render("campgrounds/edit", {campground: foundCampground});
        }
    })
   
});
//UPDATE CAMPGROUND ROUTE
router.put("/campground/:id", middleware.checkCampgroundOwnership,upload.single("image"),function(req,res){
    
    //if no image file to upload
  if(!req.file){
    var name = req.body.name;
	var price= req.body.price;
	var image = {
	                id: imageId,
	                url:imageUrl
                	};
	var description = req.body.description;
	var author = {
	              id: req.user._id,
	              username: req.user.username
	             } ;
	             
   	geocoder.geocode(req.body.location, function (err, data) {
   	    if(err){
   	        console.log(err);
   	    }
    var lat = data[0].latitude
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    
    console.log(data);
    
    var newData = {name, image, description, price, location, lat, lng: lng};
    Campground.findByIdAndUpdate(req.params.id,{$set: newData},function(err,updatedCampground){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/campground");
        }else{
            req.flash("success","Successfully Updated!");
            res.redirect("/campground/" + req.params.id);
        }
    });
    });
  }else{
      //cloudinary
      cloudinary.uploader.upload(req.file.path, function(result) {
          var name = req.body.name;
    	  var price= req.body.price;
    	  var image = {
    	                // add cloudinary public_id for the image to the campground object under image property
                          id: result.public_id,
                          // add cloudinary url for the image to the campground object under image property
                           url: result.secure_url
    	               }       
    	  var description = req.body.description;
    	  var author = {
    	              id: req.user._id,
	              username: req.user.username
	             }  
            // remove old campground image on cloudinary
            cloudinary.uploader.destroy(imageId, function(result) { console.log(result) });     
        
        	geocoder.geocode(req.body.location, function (err, data) {
           	    if(err){
           	        console.log(err);
           	    }
            var lat = data[0].latitude
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            
            console.log(data);
        
           var newData = { name, price,image, description, author,location,lat,lng};
             //find and update the correct campground
            Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, updatedCampground) {
              if (err) {
                req.flash("error", err.message);
                res.redirect("/campground");
              } else {
                
                req.flash("success","Successfully Updated!");
                res.redirect("/campground/" + req.params.id);
             }
        });  
      });
    });
  }
});
//DELETE CAMPGROUND ROUTE
router.delete("/campground/:id", middleware.checkCampgroundOwnership, function(req,res){
    Campground.findByIdAndRemove(req.params.id,function(err){
        if(err){
            console.log(err);
            res.redirect("/campground");
        }else{
            res.redirect("/campground");
        }
    })
})


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;
