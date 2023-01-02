//Required Libraraies
const fs = require('fs');
var Config = require("../data/config.json");
var Misc = require("./misc.js");

//Variables
var LogTime = Misc.GetDateString();
var TotalLogData = [];

//Exports
module.exports = { SaveLog, SaveError };

//Functions
function SaveLog(type, log) {
  console.log(Misc.GetReadableDateTime() + " - " + log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': type, 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => {  });
  }
}

function SaveError(log) {
  console.log(Misc.GetReadableDateTime() + " - " + log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': 'Error', 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => {  });
  }
}
