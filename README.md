# SolarAnalytics

I wanted to create my own solar data analytics. So i did. It's quite basic and it's reading straight from the inverter itself so I can't see this being used for anyone else another than myself. But it's here for people to read. Enjoy!

So how it works. It basically grabs specific sets of data from my Fronius Inverter using the solar_api that the inverter provides.
**![GetData](https://guardianstats.com/images/github/solar/getdata.png)**

Then with that data i sort then store it in an SQL database every 5 minutes.
**![LogData](https://guardianstats.com/images/github/solar/logdata.png)**
**![StoreData](https://guardianstats.com/images/github/solar/storedata.png)**

Then using express i make that data available for my Solar Web View to access (All local).
**![Express](https://guardianstats.com/images/github/solar/express.png)**
