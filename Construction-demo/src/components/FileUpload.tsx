/**
 * @fileoverview Generic file upload component with optional comment support.
 * 
 * Provides a reusable file selection interface with drag-and-drop support,
 * file previews, and optional per-file metadata. Works with any file type
 * and can be configured for different use cases throughout the application.
 * 
 * ## Architecture
 * 
 * The component supports two input methods:
 * 1. Traditional file input (click to browse)
 * 2. Drag-and-drop interface
 * 
 * Both methods funnel through the same validation and upload pipeline,
 * ensuring consistent behavior regardless of how files are selected.
 * 
 * ## Generic Design
 * 
 * The component uses TypeScript generics to support different file metadata
 * structures. Any file type that extends the base UploadedFile interface
 * can be used, making the component flexible for various use cases:
 * 
 * - Simple file uploads (UploadedFile)
 * - Files with comments (extends UploadedFile with comment field)
 * - Files with custom metadata (extends UploadedFile with domain-specific fields)
 * 
 * ## Upload Strategy
 * 
 * File upload is handled by the uploadFunction prop, which allows the parent
 * component to control how files are uploaded. This enables:
 * - Mock uploads for development/testing
 * - Direct S3 uploads via pre-signed URLs
 * - Backend proxy uploads
 * - Custom cloud storage integrations
 * 
 * See utils/fileUpload.ts for upload implementation examples.
 * 
 * ## File Validation
 * 
 * Files are validated before upload to prevent invalid submissions:
 * - MIME type must match acceptedTypes prop
 * - File size must not exceed maxFileSize prop
 * - All files in a batch are validated before any are uploaded
 * 
 * This all-or-nothing approach prevents partial uploads if one file is invalid.
 * 
 * @module components/FileUpload
 */

import { Download, Eye, FileText, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { isPreviewable } from '../utils/documentViewerUtils';
import type { UploadedFile } from '../utils/fileUpload';
import { formatFileSize } from '../utils/fileUpload';
import Button from './Button';

/**
 * Props for the generic FileUpload component.
 * 
 * @template T - Type of uploaded file metadata (must extend UploadedFile)
 * @interface FileUploadProps
 */
interface FileUploadProps<T extends UploadedFile> {
  /** Array of currently uploaded files */
  files: T[];
  /** Function to upload a file and return its metadata */
  uploadFunction: (file: File) => Promise<T>;
  /** Callback when files are uploaded successfully */
  onFilesUploaded: (files: T[]) => void;
  /** Callback when a file is removed */
  onFileRemove: (fileId: string) => void;
  /** Accepted file types (MIME types) */
  acceptedTypes?: string[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Whether uploads are disabled */
  disabled?: boolean;
  /** Custom file description text (e.g., "Supports ZIP, PDF files") */
  fileTypesDescription?: string;
  /** Render function for additional file metadata (e.g., comment field) */
  renderFileMetadata?: (file: T, disabled: boolean) => React.ReactNode;
  /** Callback when preview button is clicked */
  onFilePreview?: (file: T) => void;
}

/**
 * Generic file upload component with drag-and-drop and file previews.
 * Supports any file metadata type that extends UploadedFile interface.
 * 
 * @template T - Type of uploaded file metadata (must extend UploadedFile)
 * @param {FileUploadProps<T>} props - Component props
 * @returns {JSX.Element} Rendered file upload component
 * 
 * @example
 * ```tsx
 * // Simple file upload
 * <FileUpload
 *   files={uploadedFiles}
 *   uploadFunction={mockUploadFile}
 *   onFilesUploaded={setUploadedFiles}
 *   onFileRemove={handleRemove}
 * />
 * 
 * // File upload with custom metadata (e.g., comments)
 * <FileUpload
 *   files={filesWithComments}
 *   uploadFunction={uploadWithComment}
 *   onFilesUploaded={setFiles}
 *   onFileRemove={handleRemove}
 *   renderFileMetadata={(file, disabled) => (
 *     <textarea value={file.comment} disabled={disabled} />
 *   )}
 * />
 * ```
 */
export default function FileUpload<T extends UploadedFile>({
  files,
  uploadFunction,
  onFilesUploaded,
  onFileRemove,
  acceptedTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  disabled = false,
  fileTypesDescription = 'Supports ZIP, PDF, and Word documents',
  renderFileMetadata,
  onFilePreview,
}: FileUploadProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates and processes selected files before upload.
   * 
   * Performs type and size validation on each file, then uploads them
   * using the provided uploadFunction. Aggregates all successful uploads
   * and notifies parent component via onFilesUploaded callback.
   * 
   * The uploadFunction is provided by the parent, allowing different
   * upload strategies (mock, S3, backend proxy, etc.) without changing
   * this component's logic.
   * 
   * @param {FileList | null} fileList - Browser FileList from input or drop event
   * @returns {Promise<void>} Resolves when all files are processed
   * @throws {Error} If file validation fails (unsupported type or size exceeded)
   */
  const handleFiles = async (fileList: FileList | null) => {
    // Early return if no files selected or component is disabled
    if (!fileList || fileList.length === 0 || disabled) return;

    setError(null);
    setUploading(true);

    try {
      const fileArray = Array.from(fileList);

      // Validate all files before uploading any
      // This ensures we don't partially upload if one file is invalid
      for (const file of fileArray) {
        if (!acceptedTypes.includes(file.type)) {
          throw new Error(`File type not supported: ${file.name}`);
        }
        if (file.size > maxFileSize) {
          throw new Error(`File too large: ${file.name} (max ${formatFileSize(maxFileSize)})`);
        }
      }

      // Upload all files in parallel for better performance
      // Uses the uploadFunction provided by parent component
      const uploadedFiles = await Promise.all(
        fileArray.map((file) => uploadFunction(file))
      );

      // Notify parent component of successful uploads
      onFilesUploaded(uploadedFiles);
    } catch (err) {
      // Display user-friendly error message
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handles drag over event for drag-and-drop functionality.
   * Prevents default browser behavior and enables visual feedback
   * by setting isDragging state when component is not disabled.
   * 
   * @param {React.DragEvent} e - React drag event
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Prevent default to allow drop
    if (!disabled) {
      setIsDragging(true);
    }
  };

  /**
   * Handles drag leave event to reset visual feedback.
   * Called when dragged item leaves the drop zone boundary.
   */
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  /**
   * Handles file drop event when files are dropped onto the component.
   * Extracts files from dataTransfer object and initiates upload process.
   * 
   * @param {React.DragEvent} e - React drag event containing dropped files
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); // Prevent browser from opening the file
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  /**
   * Handles file input change event from traditional file picker.
   * Resets input value after processing to allow selecting the same
   * file again if user removes it and wants to re-upload.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-slate-100'}
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <Upload className="mx-auto mb-3 text-slate-400" size={40} />
        <p className="text-slate-700 font-medium mb-1">
          {uploading ? 'Staging files...' : 'Drop files here or click to browse'}
        </p>
        <p className="text-sm text-slate-500">
          {fileTypesDescription} (max {formatFileSize(maxFileSize)})
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">Staged Files ({files.length})</h3>
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
            >
              {/* File Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileText className="text-blue-500 shrink-0 mt-1" size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)} • Staged {new Date(file.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Preview Button - Show only for previewable files */}
                  {(() => {
                    const fileWithFile = file as T & { file?: File };
                    const mimeType = fileWithFile.file?.type || file.type;
                    return onFilePreview && mimeType && isPreviewable(mimeType) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFilePreview(file)}
                        disabled={disabled}
                        title="Preview document"
                        type="button"
                      >
                        <Eye size={16} />
                      </Button>
                    );
                  })()}
                  
                  {/* Download Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // For UploadedDocument with file property, create blob URL
                      const fileWithFile = file as T & { file?: File };
                      const fileObj = fileWithFile.file;
                      if (fileObj && fileObj instanceof File) {
                        const blobUrl = URL.createObjectURL(fileObj);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = file.name;
                        link.click();
                        URL.revokeObjectURL(blobUrl);
                      } else if (file.url) {
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.name;
                        link.click();
                      }
                    }}
                    disabled={disabled}
                    title="Download file"
                    type="button"
                  >
                    <Download size={16} />
                  </Button>
                  
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(file.id)}
                    disabled={disabled}
                    title="Remove file"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {/* Custom File Metadata (e.g., comments, tags, etc.) */}
              {renderFileMetadata && renderFileMetadata(file, disabled)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
