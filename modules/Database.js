const MySQL = require('mysql');
const Log = require("../js/log.js");
const DBConfig = require('../../Combined/configs/solar_db_config.json');
const fetch = require("node-fetch");

//Exports
module.exports = { InsertData, GetVoltageInfo, GetInverterInfo, GetData, expressPOSTRequest, expressUpdatePOSTRequest, expressGETRequest, expressGETJSON, expressGETLive };

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

//Express functions
async function expressPOSTRequest(req, res, name, sql) {
  Log.SaveLog("Request", `POST Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { if(rows.length > 0) { res.status(200).send({ error: null, data: rows }) } else { res.status(200).send({ error: "No data found" }) } }
  });
}

async function expressUpdatePOSTRequest(req, res, name, sql) {
  Log.SaveLog("Request", `UPDATE POST Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { res.status(200).send({ error: null, data: "Successfully updated guild information..." }) }
  });
}

async function expressGETRequest(req, res, name, sql) {
  Log.SaveLog("Request", `GET Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  const timeStart = new Date().getTime();
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else {
      if(rows.length > 0) {
        const ttf = `${ (Math.round(new Date().getTime() - timeStart) / 1000).toFixed(2) }s`;
        console.log(ttf);
        res.status(200).send({ error: null, ttf: ttf, data: rows });
      }
      else {
        res.status(200).send({ error: "No data found" })
      }
    }
  });
}

async function expressGETJSON(req, res, name, url) {
  Log.SaveLog("Request", `JSON Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  const headers = { headers: { "Content-Type": "application/json" } };
  const request = await fetch(url, headers);
  const response = await request.json();
  if(request.ok) { res.status(200).send({ error: null, data: response }) }
  else { res.status(200).send({ error: "No data found" }) }
}

async function expressGETLive(req, res, name) {
  Promise.all([await GetInverterInfo(), await GetVoltageInfo()]).then((data) => {
    res.status(200).send({
      error: null,
      data: {
        inverter: data[0],
        voltage: data[1]
      }
    });
  });
}