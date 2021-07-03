//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { response } = require('express');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: process.env.MY_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

var dateTime = "";

// mongodb connection

mongoose.connect("mongodb+srv://biswajit:biswajit7537@cluster0.csxgx.mongodb.net/docketDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);


const itemScema = new mongoose.Schema({
  num: String,
  name: String
})
itemScema.plugin(passportLocalMongoose);
const Item = new mongoose.model("Item", itemScema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

const workSchema = new mongoose.Schema({
  userName: String,
  userDate: String,
  title: String,
  workItems: [itemScema]
})
workSchema.plugin(passportLocalMongoose);
const Work = new mongoose.model("Work", workSchema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("login");
})
app.get("/register", (req, res) => {
  res.render("register");
})
app.get("/login", (req, res) => {
  res.redirect("/");
})

app.get("/list", (req, res) => {

  if (req.isAuthenticated()) {
    const day = date.getDate();
    dateTime = day;
    // -----

    Item.find({ num: req.user._id }, (err, foundItems) => {
      if (err) {
        console.log(err);
      }
      else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }
    });
  }
  else {
    res.redirect("/");
  }

});


app.post("/register", (req, res) => {

  if (req.body.password != req.body.confirmPassword) {
    res.redirect("/register");
  }
  else {

    User.register({ username: req.body.username }, req.body.password, (err, user) => {

      if (err) {
        console.log(err);
        res.redirect("/register");
      }
      else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/");
        })
      }
    })
  }
});

app.post("/", (req, res) => {

  const loginUser = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(loginUser, (err) => {
    if (err) {
      console.log(err);
    }
    else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/list");
      });
    }
  })

})

app.post("/newItem", function (req, res) {

  const newItems = req.body.newItem;
  const item = new Item({
    num: req.user._id,
    name: newItems
  })
  item.save(() => {
    res.redirect("/list");
  });
});

app.post("/delete", (req, res) => {
  const deleteItemId = req.body.checkbox;
  Item.findByIdAndRemove(deleteItemId, (err) => {
    if (err) {
      console.log(err);
    }
    else {
      res.redirect("/list");
    }
  })
});



app.get("/work", (req, res) => {
  if (req.isAuthenticated()) {
    Work.find({ userName: req.user._id }, (err, foundItems) => {
      if (err) {
        console.log(err);
      }
      else {
        res.render("work", { savedList: foundItems });
      }
    })

  }
  else {
    res.redirect("/");
  }

});

app.post("/work", (req, res) => {
  if (req.isAuthenticated()) {
    var newTitle = req.body.title;

    console.log(req.body.title);
    Item.find({ num: req.user._id }, (err, foundItems) => {
      if (err) {
        console.log(err);
      }
      else {
        if (req.body.title === "") {
          newTitle = "No Title";
        }
        const myWork = new Work({
          userName: req.user._id,
          userDate: dateTime,
          title: newTitle,
          workItems: foundItems
        })
        myWork.save(() => {
          res.redirect("/work");
        });
      }
    })

  }
});
app.post("/deleteWork", (req, res) => {
  const deleteWorkId = req.body.checkbox;
  Work.findByIdAndRemove(deleteWorkId, (err) => {
    if (err) {
      console.log(err);
    }
    else {
      res.redirect("/work");
    }
  })
})
app.post("/logout", (req, res) => {

  req.logout();
  res.redirect("/");

});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
