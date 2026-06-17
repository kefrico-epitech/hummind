"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "../../../ui/input";

type TableData = {
  cols: { id: string; label: string; width?: number }[];
  rows: { id: string; cells: Record<string, string> }[];
};

type Props = {
  value: TableData;
  onChange: (data: TableData) => void;
};

export function TableBlockEditor({ value, onChange }: Props) {
  const addColumn = () => {
    const index = value.cols.length + 1;
    const newCol = { id: `col_${Date.now()}`, label: `Colonne ${index}` };
    const cols = [...value.cols, newCol];
    const rows = value.rows.map((row) => ({
      ...row,
      cells: { ...row.cells, [newCol.id]: "" },
    }));
    onChange({ cols, rows });
  };

  const addRow = () => {
    const newRow = {
      id: `row_${Date.now()}`,
      cells: value.cols.reduce(
        (acc, col) => ({ ...acc, [col.id]: "" }),
        {} as Record<string, string>,
      ),
    };
    onChange({ ...value, rows: [...value.rows, newRow] });
  };

  const deleteColumn = (colIndex: number) => {
    const colId = value.cols[colIndex].id;
    const cols = value.cols.filter((_, i) => i !== colIndex);
    const rows = value.rows.map((row) => {
      const newCells = { ...row.cells };
      delete newCells[colId];
      return { ...row, cells: newCells };
    });
    onChange({ cols, rows });
  };

  const deleteRow = (rowIndex: number) => {
    const rows = value.rows.filter((_, i) => i !== rowIndex);
    onChange({ ...value, rows });
  };

  const updateHeader = (colIndex: number, label: string) => {
    const cols = value.cols.map((col, i) =>
      i === colIndex ? { ...col, label } : col,
    );
    onChange({ ...value, cols });
  };

  const updateCell = (rowIndex: number, colIndex: number, val: string) => {
    const colId = value.cols[colIndex].id;
    const rows = value.rows.map((row, i) =>
      i === rowIndex
        ? { ...row, cells: { ...row.cells, [colId]: val } }
        : row,
    );
    onChange({ ...value, rows });
  };

  const hasCols = value.cols.length > 0;
  const hasRows = value.rows.length > 0;

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wide text-white/45">Tableau</p>

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addColumn}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white/80 transition hover:bg-white/10"
        >
          <Plus className="h-3 w-3" /> Colonne
        </button>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white/80 transition hover:bg-white/10"
        >
          <Plus className="h-3 w-3" /> Ligne
        </button>
      </div>

      {/* Table */}
      {!hasCols || !hasRows ? (
        <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-white/40">
          Ajoutez au moins une colonne et une ligne.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[360px] border-collapse">
            {/* Header row with column labels + delete buttons */}
            <thead>
              <tr>
                {value.cols.map((col, cIdx) => (
                  <th
                    key={col.id}
                    className="relative border border-white/8 bg-white/5 p-0"
                  >
                    <input
                      type="text"
                      value={col.label}
                      onChange={(e) => updateHeader(cIdx, e.target.value)}
                      className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-white/30"
                      placeholder={`Colonne ${cIdx + 1}`}
                    />
                    {value.cols.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteColumn(cIdx)}
                        className="absolute right-1 top-1 rounded p-0.5 text-white/20 transition hover:bg-red-500/15 hover:text-red-400"
                        title="Supprimer cette colonne"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </th>
                ))}
                <th className="w-8 border border-white/8 bg-white/3" />
              </tr>
            </thead>

            {/* Data rows */}
            <tbody>
              {value.rows.map((row, rIdx) => (
                <tr key={row.id}>
                  {value.cols.map((col, cIdx) => (
                    <td key={col.id} className="border border-white/8 p-0">
                      <Input
                        value={row.cells[col.id] ?? ""}
                        onChange={(e) =>
                          updateCell(rIdx, cIdx, e.target.value)
                        }
                        className="h-10 rounded-none border-0 bg-transparent px-3 text-sm text-white"
                        placeholder="..."
                      />
                    </td>
                  ))}
                  <td className="w-8 border border-white/8 bg-white/3 text-center">
                    {value.rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteRow(rIdx)}
                        className="rounded p-1 text-white/20 transition hover:bg-red-500/15 hover:text-red-400"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
