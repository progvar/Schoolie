var express = require('express'),
exphbs = require('express-handlebars'),
logger = require('morgan'),
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
methodOverride = require('method-override'),
session = require('express-session'),
passport = require('passport'),
LocalStrategy = require('passport-local'),
TwitterStrategy = require('passport-twitter'),
GoogleStrategy = require('passport-google'),
FacebookStrategy = require('passport-facebook');

 var config = require('./config.js'), //config file contains all tokens and other private info
    funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work
    var app = express();
    app.use(express.static('public'));
    app.use(logger('combined'));
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(methodOverride('X-HTTP-Method-Override'));
    app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(function(req,res,next){
    	var err = req.session.error,
    	msg = req.session.notice,
    	success = req.session.success;

    	delete req.session.error;
    	delete req.session.success;
    	delete req.session.notice;

    	if(err) res.locals.error = err;
    	if(msg) res.locals.notice = msg;
    	if(success) res.locals.success = success;

    	next();
    });

    var hbs = exphbs.create({
    	defaultLayout: "main",
    });

    app.engine("handlebars",hbs.engine);
    app.set("view engine", "handlebars");

//===============PASSPORT=================
// Use the LocalStrategy within Passport to login/”signin” users.

passport.serializeUser(function (user,done){
	console.log("serializing " + user.username);
	done(null, user);
});

passport.deserializeUser(function (obj, done){
	console.log("deserializing " + obj);
	done(null, obj);
});


passport.use('local-signin', new LocalStrategy(
	{passReqToCallback: true},

	function(req, username, password, done){
		funct.localAuth(username, password).then(function (user){
			if(user){
				console.log("Logged in as " + user.username);
				req.session.success = "You are succesfully logged in " + user.username + " !";
				done(null, user);
			}
			if(!user){
				console.log("COULD NOT LOG IN!");
				req.session.error = "Could not log user in. Please try again.";
				done(null, user);
			}
		}).fail(function(err){
			console.log(err.body);
	});
	}
));


passport.use("local-signup", new LocalStrategy(
	{passReqToCallback:true},

	function(req, username, password, done){
		funct.localReg(username, password).then(function (user){
			if(user){
				console.log("Registered " + user.username);
				req.session.success = "You are now registered and logged in as " + user.username + " !";
				done(null, user);
			}
			if(!user){
				console.log("COULD NOT REGISTER!");
				req.session.error = "That username is already in use, please try a different one."
				done(null, user);
			}
		}).fail(function(err){
			console.log(err.body);
		});
	}
));

//===============ROUTES===============

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){ 
		return next(); 
	}

	req.session.error = "Please sign in!";
	res.redirect("/signin");
};

app.get('/', function(req, res){
	res.render('home', {user: req.user});
});

app.get('/signin', function(req, res){
	res.render('signin');
});

app.post('/local-reg', passport.authenticate('local-signup', {
	successRedirect: '/',
	failureRedirect: '/signin'
}));

app.post('/login', passport.authenticate('local-signin', { 
	successRedirect: '/',
	failureRedirect: '/signin'
}));

app.get('/logout', function(req, res){
	var name = req.user.username;
	console.log("LOGGIN OUT " + req.user.username)
	req.logout();
	res.redirect('/');
	req.session.notice = "You have successfully been logged out " + name + "!";
});


//===============PORT=================

var port = process.env.PORT || 3000;
app.listen(port);

console.log("Listening on port number " + port);