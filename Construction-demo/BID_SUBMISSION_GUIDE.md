# Bid Submission Feature

## Overview

The bid submission feature allows vendors/subcontractors to submit their bids for tender packages. This is a vendor-facing interface where they can upload documents, add comments, and submit their bids.

## URL Structure

```
/tenderpackages/:bidId/submission
```

## How It Works

### 1. Accessing the Submission Page

Vendors receive a unique link with their bid ID. For example:

```
http://localhost:5174/tenderpackages/bid-pkg-001-sub-001-1234567890-abc123/submission
```

### 2. What Vendors See

- **Project Information**:
  - Package name (displayed as "Project name")
  - Project description
  - Site address
  - Contractor bid due date
- **Subcontractor Identity**:
  - Their company name is clearly displayed
- **File Upload Section**:
  - Drag-and-drop or click to browse
  - Supports: ZIP, PDF, and Word documents
  - Maximum file size: 50MB per file
  - Comment field for each uploaded file
- **Overall Bid Comment**:
  - Large text area for general bid notes and clarifications

### 3. Submission Process

1. Vendor uploads one or more files
2. Adds optional comments to individual files
3. Adds overall bid submission notes (optional)
4. Clicks "Submit Bid"
5. Bid status updates to "Bid Submitted"
6. Success confirmation page is shown

### 4. Post-Submission

- Vendors see a success message with submission timestamp
- Bid cannot be resubmitted (one-time submission)
- All files and comments are saved with the bid record

## Technical Implementation

### File Upload Component

- **Location**: `src/components/FileUpload.tsx`
- **Features**:
  - Reusable component for any file upload needs
  - Mock S3 upload simulation (ready for real S3 integration)
  - File validation (type and size)
  - Per-file comments
  - Visual feedback for drag-and-drop

### File Upload Mock

Currently, file uploads are mocked using `URL.createObjectURL()`. In production:

1. **Get pre-signed URL** from backend:

   ```typescript
   const { uploadUrl, fileUrl } = await fetch("/api/get-upload-url", {
     method: "POST",
     body: JSON.stringify({ fileName, fileType }),
   });
   ```

2. **Upload directly to S3**:

   ```typescript
   await fetch(uploadUrl, {
     method: "PUT",
     body: file,
     headers: { "Content-Type": file.type },
   });
   ```

3. **Return the S3 URL** as the file URL in the `BidSubmissionFile` object.

### Data Structure

The bid submission extends the `BidRecord` type with:

- `files: BidSubmissionFile[]` - Array of uploaded files
- `submissionComment: string` - Overall bid comment
- `submittedAt: string` - Submission timestamp

Each `BidSubmissionFile` contains:

- File metadata (name, size, type)
- Upload timestamp
- Per-file comment
- File URL (S3 URL in production)

### Database Operations

- `submitBid()` - Submits the bid with files and comments
- `getBidById()` - Retrieves bid details for the submission page
- `getTenderPackageById()` - Retrieves tender package information
- `getSubcontractorById()` - Retrieves subcontractor information

## Testing

### To test the submission flow:

1. **Create a tender package** (if not already exists)
2. **Create a bid record** for a subcontractor
3. **Navigate to the submission URL**:
   ```
   http://localhost:5174/tenderpackages/<bidId>/submission
   ```
4. **Upload files** (any ZIP, PDF, or DOC/DOCX files)
5. **Add comments** to files and overall submission
6. **Submit the bid**
7. **Verify** the success page appears

### Example: Creating a test bid

You can create test bids by:

1. Going to the tender package invitation flow
2. Inviting subcontractors
3. The system creates bid records automatically
4. Use those bid IDs to test the submission view

## Security Considerations (Production)

1. **Authentication**: Bid submission URLs should require authentication
2. **Authorization**: Verify the vendor can only submit their own bid
3. **Rate Limiting**: Prevent abuse of file uploads
4. **File Scanning**: Scan uploaded files for malware
5. **Expiration**: Bid submission links should expire after the due date
6. **HTTPS Only**: All file uploads must use HTTPS

## Future Enhancements

- [ ] Email notifications on bid submission
- [ ] Ability to save draft bids before final submission
- [ ] Preview submitted bids (read-only mode)
- [ ] Bid withdrawal feature (before deadline)
- [ ] Attachment size optimization and compression
- [ ] Multiple file batch upload
- [ ] Progress indicators for large file uploads
