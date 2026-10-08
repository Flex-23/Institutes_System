"use client";

import { Download } from "lucide-react";
import { Button } from "./ui/button";

/// تصدير جدول إلى ملف CSV (مع BOM لدعم العربية في Excel)
export function CsvExport({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  const download = () => {
    const escape = (v: string | number) => {
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    };
    const lines = [headers, ...rows].map((r) => r.map(escape).join(","));
    const content = "﻿" + lines.join("\r\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button type="button" variant="outline" onClick={download}>
      <Download className="size-4" /> تصدير CSV
    </Button>
  );
}
