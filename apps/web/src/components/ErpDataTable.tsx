import React from "react";

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (row: T) => React.ReactNode;
}

interface ErpDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
}

export function ErpDataTable<T>({
  data,
  columns,
  title,
}: ErpDataTableProps<T>): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-md border bg-white shadow-sm">
      {title && (
        <div className="border-b bg-gray-50 px-4 py-3 font-semibold text-gray-700">{title}</div>
      )}
      <div className="w-full overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-100 text-gray-600">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-4 py-3 font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-gray-50/50">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    {col.render ? col.render(row) : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
