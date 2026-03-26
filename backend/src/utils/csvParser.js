const { parse } = require('csv-parse/sync');

const REQUIRED_COLUMNS = ['donorName', 'amount', 'method', 'receivedDate'];

function parseDonationCsv(buffer) {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = Object.keys(records[0]);
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      throw new Error(`CSV missing required column: ${col}`);
    }
  }

  return records.map((row, i) => {
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Row ${i + 2}: invalid amount "${row.amount}"`);
    }

    const validMethods = ['CHECK', 'ZELLE', 'ACH', 'CASH', 'ONLINE', 'OTHER'];
    const method = row.method?.toUpperCase();
    if (!validMethods.includes(method)) {
      throw new Error(`Row ${i + 2}: invalid method "${row.method}". Must be one of: ${validMethods.join(', ')}`);
    }

    const receivedDate = new Date(row.receivedDate);
    if (isNaN(receivedDate.getTime())) {
      throw new Error(`Row ${i + 2}: invalid receivedDate "${row.receivedDate}". Expected a valid date (e.g. 2025-01-15).`);
    }

    return {
      donorName: row.donorName,
      donorEmail: row.donorEmail || null,
      amount,
      method,
      referenceNumber: row.referenceNumber || null,
      receivedDate,
      notes: row.notes || null,
    };
  });
}

module.exports = { parseDonationCsv };
