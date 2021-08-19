const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const session=require("express-session");
const passport=require("passport");
const LocalStrategy = require('passport-local').Strategy;
const PLM=require("passport-local-mongoose");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(session({
    secret:"our littel secret.",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.set('useFindAndModify', false);
mongoose.connect("mongodb+srv://admin-rajesh:1234rk@cluster0.xmf5o.mongodb.net/miniterDB", { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.set("useCreateIndex",true);

const schema = new mongoose.Schema({
    heading: String,
    content: String,
    name: String
});
const Loginschema = new mongoose.Schema({
    username:{type: String,
               required:true,
               unique:true}
  
});
Loginschema.plugin(PLM);
const Tweet = mongoose.model("tweet", schema);
const User = mongoose.model("user", Loginschema);


passport.use(new LocalStrategy(User.authenticate()));

  
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

app.get("/", function (req, res) {
    res.render("login");
});
app.get('/input',function(req,res){
    res.render("inputpost");
})
app.get('/tweet', function (req, res) {
   if(req.isAuthenticated()){
       
       Tweet.find(function(err,item){
        res.render('tweet',{items:item});
       })
       
   }else{
      res.redirect("/login");
   }

});

app.get('/register', function (req, res) {
  
    res.render("register",{message:""});

})
app.get("/yourpost",function(req,res){
   
   Tweet.find({name:req.user.username},function(err,item){
    res.render('yourpost',{items:item});

   })

})

app.post("/yourpost",function(req,res){
    Tweet.findByIdAndDelete(req.body.id,function(err){
        if(err){
            console.log("error")
        }
    })

    res.redirect("/yourpost");
})
app.post("/input", function (req, res) {
    
    var h = req.body.heading;
    var c = req.body.content;
    var item = new Tweet({
        heading: h,
        content: c,
        name:req.user.username
    })
    item.save();
    res.redirect('/tweet');
})
app.post("/", function (req, res) {
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });
   
    req.login(user,function(err){
        if(err){
            console.log("err")
        
        }else{
            
            passport.authenticate("local")(req,res,function(){
                res.redirect("/tweet");
            });
        }
    })
})
app.post("/register", function (req, res) {
  User.find({username:req.body.username},function(err,item){
      if(item.length!==0){
          res.render("register",{message:"Username already taken"});
      }
      else{
        users=new User({
            username:req.body.username
        });
       User.register(users,req.body.password,function(err,user){
           if(err){
               console.log("error");
               res.redirect("/register");
           }else{
               console.log("safely saved")
               passport.authenticate("local")(req,res,function(){
               
                   res.redirect("/tweet");})
   
           }
   
       });
      }
  })  
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
    console.log("server has started successfully");
})