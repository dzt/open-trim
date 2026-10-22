const { table } = require('table');
const TrimAPI = require('../lib');
const api = new TrimAPI('../sample_data/tables/scott_rx7_s5_na_table.lte');

// Get Table Details
console.log(api.getTableDetails());

// Fetch VE Cell coordinates based on Load & RPM
console.log(api.getCell(-75.2, 2000));

console.log('Processing CSV file');
let stats_table;
(async () => {
    try {
        await api.analyze('../sample_data/logs/scott_rx7_s5_na_log.csv');
        console.log('Finished processing CSV file');
        stats_table = api.getTable();
        console.log(table(stats_table));
    } catch (e) {
        console.error(e);
    }
})();