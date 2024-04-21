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


