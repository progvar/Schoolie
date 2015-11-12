var bcrypt = require("bcryptjs");
		 Q = require("q"),
	config = require("../config.js"),
		db = require("orchestrate")(config.db);/* using orchestrate.io as a database service
												  for the MongoDB collections*/

exports.teacherReg = function(username,password){
	var deferred = Q.defer();
	var hash = bcrypt.hashSync(password.toString());
	var user = {
		"username": username,
		"password": hash,
		"type": "teacher",
		"avatar": "http://www.iconpot.com/icon/preview/funny-avatar.jpg"
	}
	db.get("teachers", username).then(function (result){
		console.log("Username already exists.");
		deferred.resolve(false);
	}).fail(function(result){
		console.log(result.body);
		if(result.body.message == "The requested items could not be found."){
			console.log("Username is free for use.");
			db.put("teachers", username, user).then(function(){
				console.log("User: " + user);
				deferred.resolve(user);
			}).fail(function(err){
				console.log("PUT FAIL: " + err.body);
				deferred.resolve(false);				
			});
		} else {
			deferred.reject(new Error(result.body));
		}
	});
	return deferred.promise;
};

exports.teacherAuth = function(username, password){
	var deferred = Q.defer();

	db.get("teachers", username).then(function(result){
		console.log("Found User");
		var hash = result.body.password;
		console.log(hash);
		console.log(bcrypt.compareSync(password, hash));
		if(bcrypt.compareSync(password, hash)){
			deferred.resolve(result.body);
		} else {
			console.log("PASSWORDS NOT MATCH");
			deferred.resolve(false);
		}
	}).fail(function(err){
		if(err.body.message == "The requested items could not be found."){
			console.log("Couldn't find user in db for SignIn");
			deferred.resolve(false);
		} else {
			deferred.reject(new Error(err))
		}
	});
	return deferred.promise;
};