const queue = []; //inputs {payload, callback}
const timeoutSeconds = 30;
const maxBatchSize = 950;
const lambda = require("./lambda");

const dayjs = require("dayjs");

module.exports = {
  async grab(payload) {
    return new Promise((resolve, reject) => {
      //Add item to queue with callback so this function can return
      queue.push({ payload, callback: (data) => resolve(data) });
    });
  },

  async grabData({ keyword, countryCode, startTime, endTime }, retries = 0) {
    //Invoke lambda function
    const jsonResponse = await lambda.invoke(
      "google-trends-beehive-dev-getData",
      { keyword, startTime, endTime, geo: countryCode }
    );
    
    const response = JSON.parse(jsonResponse);
    
    //Check for error
    if (response.body && (response.body.length < 30 || response.body.includes("Error"))) {
      console.log("Throttled");
      if (retries < 5) {
        console.log(`Retrying ${retries}, adding back to queueu`);
        return this.grab(
          { keyword, countryCode, startTime, endTime },
          retries + 1
        );
      } else {
        console.log("Retries exceeded");
        return [];
      }
    }
    //Parse body and reform
    const data = JSON.parse(response.body);
    return this.reformData(data);
  },

  reformData(data) {
    const parsedData = JSON.parse(data);
    return parsedData.default.timelineData.map((item) => {
      return {
        date: dayjs(item.formattedAxisTime).format("YYYY-MM-DD"),
        value: item.value[0],
      };
    });
  },

  async start() {
    //Start timer
    setInterval(async () => await this.nextTick(), timeoutSeconds * 1000);
  },

  async nextTick() {
    if (queue.length > 0) {
      const batch = queue.splice(0, maxBatchSize);
      console.log("Running " + batch.length + " requests");
      console.log("Queue length: " + queue.length);

      //Run batch
      await Promise.all(
        batch.map(async (item) => {
          const data = await this.grabData(item.payload);
          //Call callback so the promise resolves
          item.callback(data);
        })
      );
    } else {
      console.log("Queue empty");
      // process.exit();
    }
  },
};
