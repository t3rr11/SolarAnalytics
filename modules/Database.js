const MySQL = require('mysql');
const Log = require("../js/log.js");
const DBConfig = require('../../Combined/configs/solar_db_config.json');
const fetch = require("node-fetch");

//Exports
module.exports = { InsertData, GetVoltageInfo, GetInverterInfo, GetData };

//MySQL Connection
var db;
function handleDisconnect() {
  db = MySQL.createConnection(DBConfig);
  db.connect(function(err) {
    if(err) {
      console.log('Error when connecting to db: ', err);
      setTimeout(handleDisconnect, 2000);
    }
  });
  db.on('error', function(err) {
    console.log('Database Error: ', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { Log.SaveError("Backend lost connection to MySQL database. Reconnecting now..."); handleDisconnect(); }
    else { throw err; }
  });
}

handleDisconnect();

//MySQL Functions
function InsertData(data, callback) {
  var sql = "INSERT IGNORE INTO log (ac_voltage, generating, consumption, error_code, status_code, total_energy_produced) VALUES (?,?,?,?,?,?)";
  var inserts = [data.ac_voltage, Math.floor(data.generating), Math.floor(data.consumption), data.error_code, data.status_code, data.total_energy_produced];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error adding new log, Error: \n${ error }`); callback(true); }
    else { callback(false); }
  });
}

//Non database functions
async function GetVoltageInfo() { return await GetData(`http://10.1.1.242/solar_api/v1/GetMeterRealtimeData.cgi?Scope=Device&DeviceId=0`); }
async function GetInverterInfo() { return await GetData(`http://10.1.1.242/solar_api/v1/GetInverterRealtimeData.cgi?scope=Device&DataCollection=CumulationInverterData&DeviceId=1`); }
async function GetData(url) {
  const headers = { headers: { "Content-Type": "application/json" } };
  const request = await fetch(url, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
    //Error with inverter, might have sent bad headers.
    console.log(`Error: ${ JSON.stringify(response) }`);
    return { 'error': true, 'reason': response };
  }
  else if(request.ok) {
    //Everything is ok, request was returned to sender.
    return { 'error': false, 'data': response.Body.Data };
  }
  else {
    //Error in request ahhhhh!
    console.log(`Error: ${ JSON.stringify(response) }`);
    return { 'error': true, 'reason': response };
  }
}
