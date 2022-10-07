const floodRequester = require("./helpers/floodRequester");
const fs = require("fs");
const dataHelper = require("./data");

const config = require("./config.js");

//Create unique file stream
const writeStream = fs.createWriteStream("output/" + (new Date()).getTime() + ".csv");
writeStream.write("id,date,CountryCode,SubCategoryName,value\n");

let id = 0;

async function main(){
  await floodRequester.start();
  await run();
}

async function run(){
  //Request everything in parallel
  await Promise.all(config.countryCodes.map(async (countryCode) => {
    await Promise.all(Object.entries(config.subCategories).map(async ([categoryId, categoryName]) => {
      await runItem(categoryId, categoryName, countryCode);
    }));
  }));
}

async function runItem(categoryId, categoryName, countryCode){
  //Grab daily data
  const data = await dataHelper.grabDailyData(categoryName, countryCode, 2011, 1, 2013, 12);
  //Write to file
  for(const item of data){
    writeStream.write(`${id++},${item.date},${countryCode},${categoryId},${item.value}\n`);
  }
}

main();