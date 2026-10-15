// Load log file
// Parse table data

const parser = require('../table_parser');
const utils = require('../utils');

const TABLE_FILE_PATH = '../sample_data/tables/scott_rx7_s5_na_table.lte';
const LOG_FILE_PATH = '../sample_data/logs/scott_rx7_s5_na_log.csv';

let table_data;
try {
    // Parse Table Data
    table_data = parser(FILE_PATH);
    const rpm_header = table_data.x_data;
    const load_header = table_data.y_data;
    // Test Case
    const test_a = utils.locateCell(load_header, rpm_header, 20, 5000);
    console.dir({
        ...test_a,
        ve: table_data.z[test_a.x][test_a.y]
    });
} catch (e) {
    console.error(e);
}