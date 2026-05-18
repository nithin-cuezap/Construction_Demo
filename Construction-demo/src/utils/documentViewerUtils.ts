/**
 * @fileoverview Utilities for document viewer functionality.
 *
 * Provides helper functions for determining file types, preview capabilities,
 * and generating preview URLs for different document formats.
 *
 * @module utils/documentViewerUtils
 */

/**
 * Document viewer type categories
 */
export type DocumentViewerType = "pdf" | "office" | "image" | "unsupported";

/**
 * Determines if a document type is previewable in the browser.
 *
 * @param {string} mimeType - MIME type of the document
 * @returns {boolean} True if document can be previewed
 */
export function isPreviewable(mimeType: string): boolean {
  return isPDF(mimeType) || isOfficeDocument(mimeType) || isImage(mimeType);
}

/**
 * Checks if file is a PDF document.
 *
 * @param {string} mimeType - MIME type of the document
 * @returns {boolean} True if PDF
 */
export function isPDF(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

/**
 * Checks if file is an Office document (Word, Excel, PowerPoint).
 *
 * @param {string} mimeType - MIME type of the document
 * @returns {boolean} True if Office document
 */
export function isOfficeDocument(mimeType: string): boolean {
  const officeMimeTypes = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];
  return officeMimeTypes.includes(mimeType);
}

/**
 * Checks if file is an image.
 *
 * @param {string} mimeType - MIME type of the document
 * @returns {boolean} True if image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Gets the document viewer type for a given MIME type.
 *
 * @param {string} mimeType - MIME type of the document
 * @returns {DocumentViewerType} Type of viewer to use
 */
export function getDocumentViewerType(mimeType: string): DocumentViewerType {
  if (isPDF(mimeType)) return "pdf";
  if (isOfficeDocument(mimeType)) return "office";
  if (isImage(mimeType)) return "image";
  return "unsupported";
}

/**
 * Gets a human-readable file type label.
 *
 * @param {string} mimeType - MIME type of the document
 * @returns {string} Human-readable file type
 */
export function getFileTypeLabel(mimeType: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "PDF Document",
    "application/msword": "Word Document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "Word Document",
    "application/vnd.ms-excel": "Excel Spreadsheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "Excel Spreadsheet",
    "application/vnd.ms-powerpoint": "PowerPoint Presentation",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PowerPoint Presentation",
    "application/zip": "ZIP Archive",
    "application/x-zip-compressed": "ZIP Archive",
  };

  return typeMap[mimeType] || "Document";
}

/**
 * Gets an icon name for a file type (for lucide-react icons).
 *
 * @param {string} mimeType - MIME type of the document
 * @returns {string} Icon name
 */
export function getFileIcon(mimeType: string): string {
  if (isPDF(mimeType)) return "FileText";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "FileText";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "FileSpreadsheet";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
    return "Presentation";
  if (mimeType.includes("zip")) return "Archive";
  if (isImage(mimeType)) return "Image";
  return "File";
}

/**
 * Creates a blob URL from a File object for preview.
 * Note: Caller is responsible for revoking the URL when done.
 *
 * @param {File} file - File object to create URL for
 * @returns {string} Blob URL
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a blob URL to free up memory.
 *
 * @param {string} url - Blob URL to revoke
 */
export function revokePreviewUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
