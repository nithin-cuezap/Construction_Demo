import { type ChangeEvent } from 'react';
import Button from '../../components/Button';
import type { UploadedDocument } from './TenderPackageForm.types';

interface DocumentsStepProps {
  uploadedDocuments: UploadedDocument[];
  setUploadedDocuments: React.Dispatch<React.SetStateAction<UploadedDocument[]>>;
}

export default function DocumentsStep({
  uploadedDocuments,
  setUploadedDocuments,
}: DocumentsStepProps) {
  const handleDocumentUpload = (e: ChangeEvent<HTMLInputElement>, docType: 'confidential' | 'reference') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: docType,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        url: URL.createObjectURL(file),
        file: file,
      };
      setUploadedDocuments([...uploadedDocuments, newDoc]);
    }
  };

  const handleRemoveDocument = (docId: string) => {
    setUploadedDocuments(uploadedDocuments.filter((doc) => doc.id !== docId));
  };
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Confidential & Reference Documents</h2>

      <div className="mb-3 rounded-lg border border-blue-200 border-l-4 border-l-blue-500 bg-blue-50/50 p-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-900">Confidential Documents</h3>
        <p className="mt-1 text-xs text-blue-800">Visible only to Organization users</p>
        <div className="mt-3 border-2 border-dashed border-blue-300 rounded-lg p-6 mb-4 text-center cursor-pointer hover:bg-blue-100/40 transition-colors">
          <input
            type="file"
            id="confidential-upload"
            onChange={(e) => handleDocumentUpload(e, 'confidential')}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          />
          <label htmlFor="confidential-upload" className="cursor-pointer block">
            <p className="text-slate-600 font-medium">Click to upload confidential documents</p>
            <p className="text-sm text-slate-500">or drag and drop</p>
            <p className="text-xs text-slate-400 mt-2">PDF, DOC, XLS, PPT, ZIP up to 50MB</p>
          </label>
        </div>

        <div className="space-y-2">
          {uploadedDocuments
            .filter((doc) => doc.type === 'confidential')
            .map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button
                  onClick={() => handleRemoveDocument(doc.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                >
                  Remove
                </Button>
              </div>
            ))}
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/50 p-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900">Reference Documents</h3>
        <p className="mt-1 text-xs text-amber-800">Will be shared to sub-contractors</p>
        <div className="mt-3 border-2 border-dashed border-amber-300 rounded-lg p-6 mb-4 text-center cursor-pointer hover:bg-amber-100/40 transition-colors">
          <input
            type="file"
            id="reference-upload"
            onChange={(e) => handleDocumentUpload(e, 'reference')}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          />
          <label htmlFor="reference-upload" className="cursor-pointer block">
            <p className="text-slate-600 font-medium">Click to upload reference documents</p>
            <p className="text-sm text-slate-500">or drag and drop</p>
            <p className="text-xs text-slate-400 mt-2">PDF, DOC, XLS, PPT, ZIP up to 50MB</p>
          </label>
        </div>

        <div className="space-y-2">
          {uploadedDocuments
            .filter((doc) => doc.type === 'reference')
            .map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button
                  onClick={() => handleRemoveDocument(doc.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                >
                  Remove
                </Button>
              </div>
            ))}
        </div>
      </div>

      <p className="text-sm text-slate-600 mt-6">
        Total documents uploaded: <span className="font-semibold">{uploadedDocuments.length}</span>
      </p>
    </div>
  );
}
