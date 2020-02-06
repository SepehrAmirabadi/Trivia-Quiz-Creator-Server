let Allquestions = {}; 
let pickedquestions =[];

// gets questions for the create quiz page based on the selected category and difficulty
function makeRequest(){
	// get request
	req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4){
			let html = "<ul>"
			let qlist = document.getElementById("q"); 
			//console.log(qlist)
			let questions = JSON.parse(this.responseText)["Questions"];
			//console.log(this.responseText);
			questions.forEach( question =>{
				html+= "<button type = button  onclick= add('" + question["_id"]+ "') value=" +question["_id"]+ ">Add Question </button>" + "<a href= http://localhost:3000/questions/" + question["_id"] + " target = _blank>" + question.question.replace(/&quot;/g,'"').replace(/&#039;/g,"'")+"</a> <br>"
				Allquestions[question["_id"]] =(question);
			})


			html+="</ul>";
			qlist.innerHTML = html; 
		}
	}
	
	// bulding up url with query paramaters based on the users selections
	let url = "http://localhost:3000/questions"
	
		if (url.includes("?")) {
			url+="&";
		}
		else {
			url+= "?";
		}
	url+= "category=" + encodeURIComponent(document.getElementById("category").value);
		if (url.includes("?")) {
			url+="&";
		}
		else {
			url+= "?";
		}
	url+= "difficulty=" + encodeURIComponent(document.getElementById("difficulty").value);
	
	//sends get request to server with url requesting json data
	req.open("GET",url);
	req.setRequestHeader('Accept', 'application/json'); 
	req.send();
}


// adds the desired questions to the pickedquestions array 
//only activates when the add questtion button is pressed
//this array represents the questions in the quiz
function add(id) {
	//console.log(id);
	let question = Allquestions[id]; 
	if (pickedquestions.includes(question) == false){
		pickedquestions.push(question);
		load()
	}
	else {
		alert ("you cannot add the same question twice");
	}	
}

// removes the desired question when the remove button is pressed
function remove(id) {
	let index = pickedquestions.indexOf(Allquestions[id])
	console.log(index);
	if (index > -1) {
		pickedquestions.splice(index, 1);
	}
	load();
}

//puts selected questions in the questions part of the create quiz template
function load() {
	let elem = document.getElementById("currentquestions");
	let html= ""
	pickedquestions.forEach(question=>{
		html+= "<button type = button  onclick= remove('" + question["_id"]+ "') value=" +question["_id"]+ ">Remove Question </button>" + "<a href= http://localhost:3000/questions/" + question["_id"] + " target = _blank>" + question.question.replace(/&quot;/g,'"').replace(/&#039;/g,"'")+"</a> <br>"
	})
	elem.innerHTML = html;
}

// sends quiz to server if it meets the requirements otherwise it alerts the client 
function submitq () {
	let name = document.getElementById("name").value;
	let tags = document.getElementById("tags").value;
	
	if(name.length >0 && tags.length >0 && document.getElementById("currentquestions").innerHTML != '') {
			let req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
			alert("quiz added: you will now be redirected to your quiz");
			let id = JSON.parse(this.responseText).id
			window.open("http://localhost:3000/quizzes/"+id,"_self");
		}
	}
	
	//Send a PUT request to the server containing the recipe data
	req.open("POST", 'http://localhost:3000/quizzes');
	req.setRequestHeader("Content-Type", "application/json");
	req.send(JSON.stringify({questions: pickedquestions,name:name, tags:tags}));
	}
	else {
		alert("you have not completed the form. Please include a name and at least 1 tag and at least 1 question");
	}
	
	
	
}