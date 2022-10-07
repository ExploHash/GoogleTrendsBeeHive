const floodRequester = require("./helpers/floodRequester");
const dayjs = require("dayjs");


module.exports = {
  async grabDailyData(keyword, countryCode, startYear, startMonth, endYear, endMonth){
    const startTime = dayjs().year(startYear).month(startMonth - 1).date(1).format("YYYY-MM-DD");
    const endTimeTenYears = dayjs().year(startYear + 10).month(startMonth).date(1).format("YYYY-MM-DD");
    const endTime = dayjs().year(endYear).month(endMonth - 1).date(1).endOf("month").format("YYYY-MM-DD");
    
    //First grab all months
    const monthlyData = await floodRequester.grab({keyword, countryCode, startTime, endTime: endTimeTenYears});

    const promises = []; // {date, value}
    //Build promises for each month
    let runningTime = dayjs(startTime);
    while(runningTime.isBefore(endTime)){
      const endOfMonth = runningTime.endOf("month").format("YYYY-MM-DD");
      promises.push(floodRequester.grab({keyword, countryCode, startTime: runningTime.format("YYYY-MM-DD"), endTime: endOfMonth}));
      
      runningTime = runningTime.add(1, "month");
    }

    //Grab all the dailydata
    const dailyData = (await Promise.all(promises)).flat();

    //Rescale the data based on month
    for(const item of dailyData){
      const monthlyItem = monthlyData.find((monthlyItem) => monthlyItem.date === dayjs(item.date).startOf("month").format("YYYY-MM-DD"));
      item.value = Math.round(item.value * (monthlyItem.value / 100));
    }

    return dailyData;
  }
}
