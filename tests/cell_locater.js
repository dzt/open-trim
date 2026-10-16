const parser = require('../table_parser');
const utils = require('../utils');
const FILE_PATH = '../sample_data/tables/scott_rx7_s5_na_table.lte';

let table_data;
try {
    // Parse Table Data
    table_data = parser(FILE_PATH);
    const rpm_header = table_data.x_data;
    const load_header = table_data.y_data;
    // Test Case
    console.log(table_data)
    const test_a = utils.locateCell(load_header, rpm_header, -75.2, 2000);
    console.dir({
        ...test_a,
        ve: table_data.z[test_a.y][test_a.x]
    });
} catch (e) {
    console.error(e);
}