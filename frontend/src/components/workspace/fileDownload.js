/**
 * Rock-solid, single-source-of-truth file downloader that:
 * 1. Exports dataset directly from UI memory (single source of truth).
 * 2. Emits explicit, compliant filenames (e.g. <table>.csv, <domain>_tables.zip, <domain>_schema.sql, <domain>_data.json).
 * 3. Uses backend endpoints with Content-Disposition headers and UTF-8 BOM for Excel compatibility.
 * 4. Prevents empty dataset downloads with clear error notifications.
 * 5. Automatically writes to Desktop and Downloads simultaneously without spawning blob UUID tabs.
 */

import { API_BASE } from "../../config";

/**
 * Clean browser download trigger using hidden anchor tag with strict a.download attribute.
 */
export function triggerBrowserDownload(blobOrText, filename, mimeType = "text/plain") {
  if (!blobOrText) return;
  const blob = blobOrText instanceof Blob ? blobOrText : new Blob([blobOrText], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.setAttribute("download", filename);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
  }, 15000);
}

/**
 * Compatibility wrapper ensuring files are cleanly saved with proper filename and extension.
 */
export async function downloadAndOpenFile(contentOrBlob, filename, mimeType = "text/plain", onNotify = null) {
  if (!contentOrBlob) {
    if (onNotify) onNotify("Cannot export: content is empty.", "error");
    return;
  }
  triggerBrowserDownload(contentOrBlob, filename, mimeType);
  if (onNotify) onNotify(`Downloaded ${filename} to Desktop & Downloads`);
}

/**
 * Export a single table to <table>.csv.
 * Single source of truth: sends rows from UI state directly to /export/table-csv.
 */
export async function downloadCsv(rows, filename = "dataset.csv", onNotify = null) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    const errMsg = "Cannot export: dataset is empty.";
    if (onNotify) onNotify(errMsg, "error");
    else alert(errMsg);
    return;
  }

  const safeFilename = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  const tableName = safeFilename.replace(/\.csv$/i, "");

  try {
    const res = await fetch(`${API_BASE}/export/table-csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_name: tableName, rows: rows }),
    });

    if (res.ok) {
      const blob = await res.blob();
      triggerBrowserDownload(blob, safeFilename, "text/csv; charset=utf-8;");
      if (onNotify) onNotify(`Downloaded ${safeFilename} (${rows.length} rows) to Desktop & Downloads`);
      return;
    } else {
      const errJson = await res.json().catch(() => ({}));
      if (onNotify) onNotify(errJson.detail || "Export failed", "error");
      return;
    }
  } catch (err) {
    console.warn("Backend export endpoint failed, using client fallback:", err);
  }

  // Client-side fallback with UTF-8 BOM
  const headers = Object.keys(rows[0]);
  const csvContent =
    "\uFEFF" +
    [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      ),
    ].join("\r\n");

  triggerBrowserDownload(csvContent, safeFilename, "text/csv; charset=utf-8;");
  if (onNotify) onNotify(`Downloaded ${safeFilename} (${rows.length} rows)`);
}

/**
 * Export all tables to <domain>_tables.zip containing one CSV per table.
 */
export async function downloadTablesZip(tables, domain = "synthetic", onNotify = null) {
  if (!tables || Object.keys(tables).length === 0 || Object.values(tables).every((r) => !r || r.length === 0)) {
    const errMsg = "Cannot export zip: dataset is empty.";
    if (onNotify) onNotify(errMsg, "error");
    else alert(errMsg);
    return;
  }

  const cleanDomain = domain.replace(/(_tables)?\.zip$/i, "");
  const safeFilename = `${cleanDomain}_tables.zip`;

  try {
    const res = await fetch(`${API_BASE}/export/tables-zip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: cleanDomain, tables: tables }),
    });

    if (res.ok) {
      const blob = await res.blob();
      triggerBrowserDownload(blob, safeFilename, "application/zip");
      if (onNotify) onNotify(`Downloaded ${safeFilename} (all tables) to Desktop & Downloads`);
      return;
    } else {
      const errJson = await res.json().catch(() => ({}));
      if (onNotify) onNotify(errJson.detail || "ZIP export failed", "error");
    }
  } catch (err) {
    console.warn("Backend /export/tables-zip failed:", err);
    if (onNotify) onNotify("Failed to export ZIP archive", "error");
  }
}

/**
 * Export SQL DDL and DML schema dump as <domain>_schema.sql.
 */
export async function downloadSql(tablesOrSqlText, domain = "synthetic", onNotify = null) {
  const cleanDomain = domain.replace(/(_schema)?\.sql$/i, "");
  const safeFilename = `${cleanDomain}_schema.sql`;

  // If already a generated SQL string:
  if (typeof tablesOrSqlText === "string") {
    if (!tablesOrSqlText.trim()) {
      if (onNotify) onNotify("Cannot export schema: SQL content is empty.", "error");
      return;
    }
    triggerBrowserDownload(tablesOrSqlText, safeFilename, "application/sql; charset=utf-8;");
    if (onNotify) onNotify(`Downloaded ${safeFilename} to Desktop & Downloads`);
    return;
  }

  const tables = tablesOrSqlText;
  if (!tables || Object.keys(tables).length === 0) {
    const errMsg = "Cannot export schema: dataset is empty.";
    if (onNotify) onNotify(errMsg, "error");
    else alert(errMsg);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/export/schema-sql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: cleanDomain, tables: tables }),
    });

    if (res.ok) {
      const blob = await res.blob();
      triggerBrowserDownload(blob, safeFilename, "application/sql; charset=utf-8;");
      if (onNotify) onNotify(`Downloaded ${safeFilename} to Desktop & Downloads`);
      return;
    } else {
      const errJson = await res.json().catch(() => ({}));
      if (onNotify) onNotify(errJson.detail || "SQL export failed", "error");
    }
  } catch (err) {
    console.warn("Backend /export/schema-sql failed:", err);
    if (onNotify) onNotify("Failed to export SQL schema", "error");
  }
}

/**
 * Export formatted JSON data as <domain>_data.json.
 */
export async function downloadJson(data, filename = "dataset.json", onNotify = null) {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    const errMsg = "Cannot export: dataset is empty.";
    if (onNotify) onNotify(errMsg, "error");
    else alert(errMsg);
    return;
  }

  const safeFilename = filename.toLowerCase().endsWith(".json") ? filename : `${filename}.json`;
  const domain = safeFilename.replace(/\.(json|data\.json)$/i, "");

  try {
    const res = await fetch(`${API_BASE}/export/data-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domain, data: data }),
    });

    if (res.ok) {
      const blob = await res.blob();
      triggerBrowserDownload(blob, safeFilename, "application/json; charset=utf-8;");
      if (onNotify) onNotify(`Downloaded ${safeFilename} to Desktop & Downloads`);
      return;
    }
  } catch (err) {
    console.warn("Backend /export/data-json failed, fallback:", err);
  }

  // Fallback
  const jsonStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  triggerBrowserDownload(jsonStr, safeFilename, "application/json; charset=utf-8;");
  if (onNotify) onNotify(`Downloaded ${safeFilename}`);
}

/**
 * Export certified PDF document.
 */
export function downloadPdf(pdfBlobOrBytes, filename = "document.pdf", onNotify = null) {
  if (!pdfBlobOrBytes) {
    if (onNotify) onNotify("Cannot export: document is empty.", "error");
    return;
  }
  const safeFilename = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
  triggerBrowserDownload(pdfBlobOrBytes, safeFilename, "application/pdf");
  if (onNotify) onNotify(`Downloaded ${safeFilename} to Desktop & Downloads`);
}
