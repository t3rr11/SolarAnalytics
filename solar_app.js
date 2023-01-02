//Modules
let Log = require(__dirname + '/js/log.js');
var Config = require("./data/config.json");
const Database = require("./modules/Database");
const Misc = require("./modules/Misc");
const cors = require("cors")
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
var app = express();

app.use(cors());
app.use(compression());
app.use(bodyParser.json({ extended: true }));

//Gets
app.get("/api/GetCurrentStatus", async function(req, res) { await Database.expressGETRequest(req, res, `GetCurrentStatus`, `SELECT * FROM log ORDER BY id DESC LIMIT 1`); });
app.get("/api/GetDailyStatus", async function(req, res) { await Database.expressGETRequest(req, res, `GetDailyStatus`, `SELECT * FROM log WHERE datetime >= NOW() - INTERVAL 1 DAY`); });
app.get("/api/GetWeeklyStatus", async function(req, res) { await Database.expressGETRequest(req, res, `GetWeeklyStatus`, `SELECT * FROM log WHERE datetime >= NOW() - INTERVAL 7 DAY`); });
app.get("/api/GetMonthlyStatus", async function(req, res) { await Database.expressGETRequest(req, res, `GetMonthlyStatus`, `SELECT * FROM log WHERE datetime >= NOW() - INTERVAL 31 DAY`); });
app.get("/api/GetLiveData", async function(req, res) { await Database.expressGETLive(req, res, `GetLiveData`) });

//Data
var StartupTime = new Date().getTime();
var logged = false;

//Functions
async function StartUp() {
  //Start up console log
  if(Config.enableDebug){ console.clear(); }
  Log.SaveLog("Info", `Solar Analytics Server has started.`);
  Log.SaveLog("Info", `Tracking ${ Config.enableTracking ? "Enabled." : "Disabled." }`);

  //Get data
  async function LogData() {
    console.log(`Getting data: ${ new Date().toLocaleString() }`);
    var VoltageInfo; try { VoltageInfo = await Database.GetVoltageInfo(); } catch (err) { console.log(err); }
    var InverterInfo; try { InverterInfo = await Database.GetInverterInfo(); } catch (err) { console.log(err); }
    if(VoltageInfo && InverterInfo) {
      const Data = {
        ac_voltage: VoltageInfo.data.Voltage_AC_Phase_1,
        generating: InverterInfo.data.PAC ? InverterInfo.data.PAC.Value : 0,
        consumption: VoltageInfo.data.PowerReal_P_Sum,
        error_code: InverterInfo.data.DeviceStatus.ErrorCode,
        status_code: InverterInfo.data.DeviceStatus.StatusCode,
        total_energy_produced: InverterInfo.data.TOTAL_ENERGY.Value
      }
      Database.InsertData(Data, function(isError) { if(!isError) { console.log(`Successfully added data: ${ new Date().toLocaleString() }`); } });
    }
    else { setTimeout(() => { LogData(); }, 5000); }
  }

  //SetIntervals
  setInterval(() => {
      if(new Date().getSeconds() === 0) {
        if(logged === false) {
          logged = true;
          LogData();
        }
      }
      else { if(logged) { logged = false; } }
    }, 1000
  );
};

StartUp();

app.listen(3100, function () { Log.SaveLog("Normal", "Express is listening on port 3100...") });