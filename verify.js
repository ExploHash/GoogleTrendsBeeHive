const fs = require('fs');
const readline = require('readline');

const fileId = "1665128910757";
const readStream = fs.createReadStream(`output/${fileId}.csv`);
const config = require('./config.js');

//Count per category
//Record {total: 0, countryCodes: {code: count}}
const categoryCount = {
}

//Linereader
const rl = readline.createInterface({
  input: readStream,
  crlfDelay: Infinity
});

//Read line by line
rl.on('line', (line) => {
  const [id, date, countryCode, categoryId] = line.split(',');
  if (!categoryCount[categoryId]) {
    categoryCount[categoryId] = {
      total: 1,
      countryCodes: {
        [countryCode]: 1
      }
    }
  }else{
    categoryCount[categoryId].total++;
    if (!categoryCount[categoryId].countryCodes[countryCode]) {
      categoryCount[categoryId].countryCodes[countryCode] = 1;
    }else{
      categoryCount[categoryId].countryCodes[countryCode]++;
    }
  }
});

rl.on('close', () => {
  //Calculate stats
  for (let categoryId in categoryCount) {
    const category = categoryCount[categoryId];
    category.countryCodesCount = Object.keys(category.countryCodes).length;
    category.missingCountryCodes = config.countryCodes.filter(code => !category.countryCodes[code]);
    category.missingCountryCodesCount = category.missingCountryCodes.length;
    category.incompleteCountryCodes = Object.entries(category.countryCodes).reduce((acc, [code, count]) => count < 1096 ? acc.concat(code) : acc, []);
    category.incompleteCountryCodesCount = category.incompleteCountryCodes.length;

    delete category.countryCodes;
  }

  fs.writeFileSync(`output/${fileId}_verify.json`, JSON.stringify(categoryCount, null, 2));
});


