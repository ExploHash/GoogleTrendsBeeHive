const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const client = new LambdaClient({ region: "us-east-1" });

module.exports = {
  //Call lambda function in cloud
  async invoke(functionName, payload){
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });
    
    const response = await client.send(command);
    return new TextDecoder().decode(response.Payload);
  }
}