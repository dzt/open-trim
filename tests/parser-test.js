const parser = require('../parser');
const FILE_PATH = '../sample_data/rx7_6pt_fuel_table.lte';
let table_data;
try {
    table_data = parser(FILE_PATH);
    console.dir(table_data);
} catch (e) {
    console.error(e);
}