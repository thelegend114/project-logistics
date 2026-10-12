"use client";

import type { ReactNode } from "react";

type DataTableColumn<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
};

export default function DataTable<T extends object>({
  columns,
  data,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div
        style={{
          padding: "30px 20px",
          textAlign: "center",
          color: "#64748b",
          fontSize: "13px",
          border: "1px dashed #cbd5e1",
          borderRadius: "10px",
          background: "#f8fafc",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: "700px",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            {columns.map((column) => (
              <th
                key={String(column.key)}
                style={{
                  padding: "12px 14px",
                  textAlign: "left",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                borderBottom:
                  rowIndex === data.length - 1
                    ? "none"
                    : "1px solid #f1f5f9",
              }}
            >
              {columns.map((column) => {
                const value = row[column.key];
                
                console.log("DATATABLE ROW:", row);
                console.log("COLUMN:", column.key, "VALUE:", value);

                return (
                  <td
                    key={String(column.key)}
                    style={{
                      padding: "13px 14px",
                      fontSize: "13px",
                      color: "#334155",
                      verticalAlign: "middle",
                    }}
                  >
                    {column.render
                      ? column.render(value, row)
                      : String(value ?? "—")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}