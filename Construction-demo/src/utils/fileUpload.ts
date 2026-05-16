/**
 * @fileoverview File upload utilities for client-side file handling and S3 integration.
 *
 * Provides functions for uploading files to cloud storage (S3) and formatting
 * file metadata. Currently includes mock implementation for development, with
 * production-ready patterns for actual S3 integration.
 *
 * ## Production Migration
 *
 * To enable real S3 uploads:
 * 1. Implement backend endpoint to generate pre-signed URLs
 * 2. Replace mockUploadFile with uploadFileToS3
 * 3. Configure AWS credentials and bucket policies
 * 4. Update CORS settings on S3 bucket for client-side uploads
 *
 * @module utils/fileUpload
 */

/**
 * Generic uploaded file metadata structure.
 * Used across the application for any file upload functionality.
 *
 * @interface UploadedFile
 * @property {string} id - Unique identifier for the uploaded file
 * @property {string} name - Original filename
 * @property {number} size - File size in bytes
 * @property {string} type - MIME type of the file
 * @property {string} uploadedAt - ISO 8601 timestamp when file was uploaded
 * @property {string} url - URL or path to access the file (S3 URL in production)
 */
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url: string;
}

/**
 * Simulates uploading a file and returns file metadata.
 *
 * ## Current Behavior (Mock)
 *
 * Creates a temporary object URL using URL.createObjectURL() to simulate
 * a file upload. Adds a 500ms delay to mimic network latency. This allows
 * the UI to work fully without requiring actual cloud storage infrastructure.
 *
 * ## Production Implementation
 *
 * In production, replace this with uploadFileToS3() which performs real S3 uploads:
 *
 * ```typescript
 * // Use this in production:
 * const uploadedFile = await uploadFileToS3(file);
 * ```
 *
 * @param {File} file - The browser File object to upload
 * @returns {Promise<UploadedFile>} Mock uploaded file metadata with temporary object URL
 */
export async function mockUploadFile(file: File): Promise<UploadedFile> {
  // Simulate network delay for realistic UX during development
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Create temporary URL for development/testing
  // Note: In production, this would be an actual S3 URL
  const mockUrl = URL.createObjectURL(file);

  // Generate unique file ID
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    id: fileId,
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    url: mockUrl,
  };
}

/**
 * Uploads a file directly to S3 using pre-signed URL (production implementation).
 *
 * ## Workflow
 *
 * 1. Request pre-signed URL from backend
 * 2. Upload file directly to S3 using the pre-signed URL
 * 3. Return file metadata with permanent S3 URL
 *
 * ## Backend Endpoint Requirements
 *
 * Your backend should provide a POST endpoint (e.g., `/api/upload/presigned-url`)
 * that accepts:
 * ```json
 * {
 *   "fileName": "document.pdf",
 *   "fileType": "application/pdf",
 *   "fileSize": 1048576
 * }
 * ```
 *
 * And returns:
 * ```json
 * {
 *   "uploadUrl": "https://bucket.s3.amazonaws.com/...",
 *   "fileUrl": "https://bucket.s3.amazonaws.com/files/...",
 *   "fileId": "unique-file-id"
 * }
 * ```
 *
 * ## S3 Bucket Configuration
 *
 * Ensure your S3 bucket has proper CORS configuration:
 * ```json
 * [
 *   {
 *     "AllowedOrigins": ["https://yourdomain.com"],
 *     "AllowedMethods": ["PUT", "POST"],
 *     "AllowedHeaders": ["*"],
 *     "MaxAgeSeconds": 3000
 *   }
 * ]
 * ```
 *
 * @param {File} file - The browser File object to upload
 * @returns {Promise<UploadedFile>} Uploaded file metadata with S3 URL
 * @throws {Error} If pre-signed URL request fails or S3 upload fails
 */
export async function uploadFileToS3(file: File): Promise<UploadedFile> {
  // Step 1: Request pre-signed URL from backend
  const response = await fetch("/api/upload/presigned-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get upload URL: ${response.statusText}`);
  }

  const { uploadUrl, fileUrl, fileId } = await response.json();

  // Step 2: Upload file directly to S3 using pre-signed URL
  // This bypasses the backend, reducing server load and improving speed
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
  }

  // Step 3: Return file metadata with permanent S3 URL
  return {
    id: fileId,
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    url: fileUrl,
  };
}

/**
 * Formats file size in human-readable format.
 *
 * Converts raw byte count into appropriate units (Bytes, KB, MB, GB)
 * with automatic unit selection based on magnitude. Uses binary
 * units (1024 bytes = 1 KB) as is standard for file sizes.
 *
 * ## Examples
 *
 * - formatFileSize(0) → "0 Bytes"
 * - formatFileSize(1024) → "1 KB"
 * - formatFileSize(1536) → "1.5 KB"
 * - formatFileSize(1048576) → "1 MB"
 * - formatFileSize(52428800) → "50 MB"
 *
 * The result is rounded to 2 decimal places for readability,
 * preventing overly precise values like "1.4567890234 MB".
 *
 * @param {number} bytes - File size in bytes (non-negative integer)
 * @returns {string} Formatted file size with appropriate unit (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024; // Binary kilobyte (2^10)
  const sizes = ["Bytes", "KB", "MB", "GB"];

  // Calculate which unit to use based on log base 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Convert to selected unit and round to 2 decimal places
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Validates file type against allowed types.
 *
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if file type is allowed
 */
export function isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validates file size against maximum allowed size.
 *
 * @param {File} file - The file to validate
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {boolean} True if file size is within limit
 */
export function isFileSizeAllowed(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}
