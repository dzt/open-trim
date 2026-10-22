const calculateApprox = (header, val) => {
    const numbers = typeof header === 'string' ? header.split(',').map(Number) : header;
    for (let i = 0; i < numbers.length - 1; i++) {
        const a = numbers[i];
        const b = numbers[i + 1];
        if (a <= val && val <= b) {
            const diff = b - a;
            const median = a + (diff / 2);
            if (val > median) {
                return {
                    cell_index: i + 1,
                    score: 1 - ((b - val) / (b - median))
                };
            } else {
                return {
                    cell_index: i,
                    score: 1 - ((val - a) / (median - a))
                };
            }
        } else if (val < a) { // cranking conditions
            return {
                cell_index: i,
                score: 1
            };
        }
    }
    throw new Error('Failed to locate value within header range');
}

const locateCell = (load_header, rpm_header, load, rpm) => {
    let approx_x, approx_y;
    let x_score, y_score;
    let approx_score; // Used for potential throw-away data
    const rpm_approx = calculateApprox(rpm_header, rpm);
    const load_approx = calculateApprox(load_header, load);
    return {
        x: rpm_approx.cell_index,
        y: load_approx.cell_index,
        score: (50 * rpm_approx.score) + (50 * load_approx.score)
    }
}

const getMedian = (sortedArr) => {
  const mid = Math.floor(sortedArr.length / 2);
  if (sortedArr.length % 2 === 0) {
    return (sortedArr[mid - 1] + sortedArr[mid]) / 2;
  }
  return sortedArr[mid];
}

const extractValidPoints = (grid) => {
    let rows = grid.length;
    let cols = grid[0].length;
    let points = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let val = grid[y][x];
            if (val !== null && val !== undefined) {
                points.push({
                    x, y,
                    norm_y: y / (rows - 1),
                    norm_x: x / (cols - 1),
                    ve: val,
                    hit_count: 50 // TODO: replace with actual hit counts per cell
                });
            }
        }
    }
    return points;
}

const calculateNormalizedDistance = (r1, c1, r2, c2, num_rows, num_cols) => {
    let normR1 = r1 / (num_rows - 1);
    let normC1 = c1 / (num_cols - 1);
    let normR2 = r2 / (num_rows - 1);
    let normC2 = c2 / (num_cols - 1);
    let dr = normR1 - normR2;
    let dc = normC1 - normC2;
    return Math.sqrt((dr * dr) + (dc * dc));
}

const gaussianInterpolateTable = (table, sigma = 0.15) => {
    let points = extractValidPoints(table);
    for (let y = 0; y < table.length; y++) {
        for (let x = 0; x < table[y].length; x++) {
            if (grid[y][x] !== null) continue;
            let numerator = 0;
            let denominator = 0;
            let closestDistance = Infinity;
            for (let pt of points) {
                const dist = calculateNormalizedDistance(y, x, pt.y, pt.x);
                closestDistance = Math.min(closestDistance, dist);
                const weight_exp = -(dist ** 2) / (2 * (sigma ** 2));
                const weight = Math.exp(weight_exp) * pt.hit_count;
                numerator += pt.ve * weight;
                denominator += weight;
            }
            if (closestDistance < 0.4 && denominator > 0) {
                table[r][c] = Number((numerator / denominator).toFixed(2));
            }
        }
    }
    return table;
}

// Used to parse CSV log row
const parseSample = (config, data) => {
    return {
        rpm: Number(data[config.rpm]),
        tps: Number(data[config.tps]),
        map: Number(data[config.map]),
        mgp: Number(data[config.mgp]),
        tps_delta: Number(data[config.tps_delta]),
        afr_target: Number(data[config.afr_target]),
        afr_actual: Number(data[config.afr_actual])
    }
}

module.exports = {
    locateCell,
    getMedian,
    gaussianInterpolateTable,
    parseSample
}