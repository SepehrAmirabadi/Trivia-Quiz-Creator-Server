//Create express app
const express = require('express');
let app = express();

//Database variables
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;
let fs = require('fs');

//View engine
app.set("view engine", "pug");

//Set up the routes
app.use(express.static("public"));
app.use (express.json()); 

// route handlers
app.get("/", sendIndex);
app.get("/questions", sendQuestions);
app.get("/clientSide.js", js);
app.get("/questions/:qID", sendQuestion);
app.get("/createquiz",createQuiz) 
app.post("/quizzes",addquiz)
app.get("/quizzes",getQuizzes)
app.get("/quizzes/:quizID",getQuiz)

// loads the index.pug page
function sendIndex(req, res, next){
	res.render("index"); 
}

// pipes the client side js so that the create quiz page can operate
function js (req,res,next) {
	stream = fs.createReadStream("clientSide.js").pipe(res);
}

//sends a question with the specified id to the client
//if json is requested json will be provided
//otherwise we load html with a template engin
function sendQuestion(req, res, next){
	let oid;
	try{
		oid = new mongo.ObjectID(req.params.qID);
	}catch{
		res.status(404).send("Status 404: Unknown ID");
		return;
	}
	//queries database for id
	db.collection("questions").findOne({"_id":oid}, function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
		if(!result){
			res.status(404).send("Unknown ID");
			return;
		}
		res.format ({
	
		"text/html": function (){
			res.status(200).render("question", {question:result});
		},
		"application/json" : function (){
			res.json({Question:result});
		},
		  'default': function () {
		res.status(406).send('Not Acceptable')
		}
	
	})
	});
}

// sends a list of 25 questions that meet the query paramaters
function sendQuestions (req,res,next) {
	let queryobj ={}; 
	let category = req.query.category; 
	let diff = req.query.difficulty; 

	// building the query object used in find
	if (diff != null && diff != "any") {
		queryobj["difficulty"] = {$regex: diff, $options: 'i'}; 
	}
	if (category != null&& category != "any") {
		queryobj["category"] = {$regex: category, $options: 'i'};
	}
	//console.log (queryobj);
	
	//finds at most 25 questions that match the query paramaters and serves up json or html depending on the request
	db.collection("questions").find(queryobj).limit(25).toArray(function (err,results) {
		//console.log(results);
		if (err) throw err; 
		//res.status(200).send(JSON.stringify({results:results}));
		res.format ({
	
		"text/html": function (){
			res.render("questions",{questions:results}); 
		},
		"application/json" : function (){
			res.json({Questions:results});
		},
		  'default': function () {
		res.status(406).send('Not Acceptable')
		}
	
	})
	})
	
}

//serves up the template html that allows the client to create quizzes
function createQuiz(req,res,next) {

	let categories;
	let difficulties;
	db.collection("questions").distinct("category",(function(err,result) {
	if (err) return err; 
	categories = result;
	db.collection("questions").distinct("difficulty",function(err,result2) {
		if (err) return err;
		difficulties = result2;
			res.render("createquiz",{difficulties:result2,categories:result});
			console.log({difficulties:result2,categories:result});
	})
}));
	
}

// checks to see if the quiz sent to the server is valid
// if it is valid it adds it to the database
function addquiz(req,res,next) {
	let name = req.body.name;
	let tags  = req.body.tags.split(" "); 
	let questions = req.body.questions; 
	let valid =true; 
	let id;
	if (name == null || tags== null) {
		valid = false; 
	}
	questions.forEach(q=>{
		if (db.collection("questions").find(q["_id"]) == null) {
			valid = false;
		}
	})
	if (valid == true){
		db.collection("quizzes").insertOne({creator: name, tags:tags,questions: questions}, function(err,result){
			if(err) throw err;
			id = result.ops[0]["_id"];
			res.status(200).send(JSON.stringify({id:id}));
		});
	}
	else {
		res.status(404).send("quiz is incompatible with the server requirements");
	}
}


//gets the quizzes
//queries the quizzes collection by creator name and tag 
//serves up the quizzes in the requested format
function getQuizzes(req,res,next) {
	
	// variable declerations
	let QueryObj = {}
	let creator = req.query.creator; 
	let tag = req.query.tag;
	//makes sure tag is case insensitive without partial matching 
	let regex = [new RegExp("^"+tag+"$","i")]
	
	// creating the query object
	if (tag != null) {
		QueryObj["tags"] = {$in : regex}; 
	}
	if(creator != null) {
		QueryObj["creator"] = {$regex: creator, $options: 'i'}; 
	}
	
	// searching through the database and returning results
	db.collection("quizzes").find(QueryObj).toArray(function (err,results) {
		//console.log(results);
		if (err) throw err; 
		//res.status(200).send(JSON.stringify({results:results}));
		console.log(results)
		res.format ({
	
		"text/html": function (){
			res.render("Quizzes",{Quizzes:results}); 
		},
		"application/json" : function (){
			res.json({Quizzes:results});
		},
		  'default': function () {
		res.status(406).send('Not Acceptable')
		}
		})
	})
	
}

// returns a quiz with the specified id if it is valid
function getQuiz(req,res,next) {
		let oid;
	try{
		oid = new mongo.ObjectID(req.params.quizID);
	}catch{
		res.status(404).send("Unknown ID");
		return;
	}
	
	db.collection("quizzes").findOne({"_id":oid}, function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
		if(!result){
			res.status(404).send("Status 404: Unknown ID");
			return;
		}
		res.format ({
	
		"text/html": function (){
			res.status(200).render("quiz", {quiz:result});
		},
		"application/json" : function (){
			res.json({Quiz:result});
		},
		  'default': function () {
		res.status(406).send('Not Acceptable')
		}
	
	})
	});
	
	
	
}



// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;

  //Get the t8 database
  db = client.db('a4');
  //console.log(db);

	

  // Start server once Mongo is initialized
  app.listen(3000);
  console.log("Listening on port 3000");
});