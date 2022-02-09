const fs = require("fs");
const path = require("path");
const os = require('os');


function createObject(){
  console.log("Creating Object");
  let student = { 
      name: 'Ryan',
      age: 26, 
      gender: 'Male',
      role: 'DPS'
  };

  var dir = os.homedir()+'/Desktop/DPSoftware';
  console.log(dir);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  fs.writeFileSync(path.resolve(dir, 'student.json'), JSON.stringify(student));

}

function loadObject(){
  console.log("Loading Object");

  var dir = os.homedir()+'/Desktop/DPSoftware';
  console.log(dir);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  let rawdata = fs.readFileSync(path.resolve(dir, 'student.json'));
  let student = JSON.parse(rawdata);
  console.log(student);

}

function saveObject(){
  console.log("Saving Object");

}