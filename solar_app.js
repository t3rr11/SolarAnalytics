//Modules
let Log = require(__dirname + '/js/log.js');
var Config = require("./data/config.json");
const Database = require("./modules/Database");

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
    var VoltageInfo = await Database.GetVoltageInfo();
    var InverterInfo = await Database.GetInverterInfo();
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

  LogData();

  //SetIntervals
  setInterval(function() { var numbers = [0,1,2,3,4,5,6,7,8,9,10,11]; if(numbers.includes(new Date().getMinutes() / 5)) { if(logged === false) { logged = true; LogData(); } } else { if(logged) { logged = false; } } }, 1000);
};

StartUp();
