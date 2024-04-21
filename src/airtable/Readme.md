//https://docs.google.com/spreadsheets/d/1qajgJSF1Mfi3uN84ipHIpJNL56rgXXO3S547OJTCvUs/edit#gid=0

//https://blogorithm.hashnode.dev/airtable-webhooks-with-express-and-ngrok
//https://circleci.com/blog/webhooks-airtable/

//https://www.airscript.dev/2021/04/01/airtable-automations-and-webhooks
//https://airtable.temba.io/
//https://circleci.com/blog/webhooks-airtable/

//https://support.airtable.com/docs/airtable-webhooks-api-overview
//https://support.airtable.com/docs/run-a-script-action
//https://support.airtable.com/docs/getting-started-with-airtable-automations
//https://www.airscript.dev/2021/01/31/airtable-automations-scripts

//https://www.airscript.dev/


--- установить cors расширение для браузера
--- в automation add

let data = input.config();

console.log(data);

let response = await fetch('https://shy-boxes-try.loca.lt/airtable/signal', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
        'Content-Type': 'application/json',
    },
});
console.log(await response.text());



let table = base.getTable("test_api");
let query = await table.selectRecordsAsync({fields: table.fields});
output.table(query.records);
let response = await fetch('https://shy-boxes-try.loca.lt/airtable/signal', {
    method: 'POST',
    body: JSON.stringify(query.records),
    headers: {
        'Content-Type': 'application/json',
    },
});
console.log(await response.text());


