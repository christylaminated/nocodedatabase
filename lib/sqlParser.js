/**
 * A simple SQL parser to extract table and column information from CREATE TABLE statements.
 * This is not a full-fledged SQL parser and has limitations, but it works for the expected
 * format from the Llama API.
 */
export function parseSqlSchema(sqlString) {
  if (!sqlString || typeof sqlString !== 'string') {
    return [];
  }

  const tables = [];
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."]+)\s*\(([\s\S]+?)\);/gi;
  
  let tableMatch;
  while ((tableMatch = tableRegex.exec(sqlString)) !== null) {
    const tableName = tableMatch[1].replace(/"/g, '');
    const columnsString = tableMatch[2];

    const columns = [];
    const columnDefs = columnsString.split(',').map(def => def.replace(/\n/g, ' ').trim()).filter(Boolean);

    for (const line of columnDefs) {
        if (line.toUpperCase().startsWith('PRIMARY KEY') || line.toUpperCase().startsWith('FOREIGN KEY') || line.toUpperCase().startsWith('CONSTRAINT') || line.toUpperCase().startsWith('CHECK')) {
            continue;
        }

        const columnParts = line.match(/^([\w."]+)\s+((?:[\w]+)(?:\(\d+(?:,\s*\d+)?\))?)(.*)/);
        if (columnParts) {
            const columnName = columnParts[1].replace(/"/g, '');
            const dataType = columnParts[2];
            const constraints = columnParts[3] || '';

            columns.push({
                name: columnName,
                type: dataType.toLowerCase(),
                isPrimaryKey: constraints.toUpperCase().includes('PRIMARY KEY'),
                isNotNull: constraints.toUpperCase().includes('NOT NULL'),
                isUnique: constraints.toUpperCase().includes('UNIQUE'),
            });
        }
    }

    if (tableName && columns.length > 0) {
        tables.push({
            tableName: tableName,
            columns: columns,
        });
    }
  }

  return tables;
} 