import { useEffect, useState } from 'react';
import Button from '../components/Button';
import { getNextPackageControlNumber } from '../TenderPackage.ops';
import type { Address, ContactDetails, TenderPackage } from '../types';
import SelectionView from './SelectionView';

interface TenderPackageFormViewProps {
  editingPackage?: TenderPackage;
  currentStep: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  onSaveAndContinue: (packageData: TenderPackage, nextStep: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
  onSaveAndExit: (packageData: TenderPackage) => void;
  onCancel: () => void;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

const isValidCoordinate = (value: number, min: number, max: number) => Number.isFinite(value) && value >= min && value <= max;

const getOpenStreetMapEmbedUrl = (latitude: number, longitude: number) => {
  if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) {
    return null;
  }

  const delta = 0.01;
  const left = Math.max(-180, longitude - delta);
  const right = Math.min(180, longitude + delta);
  const top = Math.min(90, latitude + delta);
  const bottom = Math.max(-90, latitude - delta);

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
};

const buildSiteAddressFromNominatim = (result: NominatimSearchResult): Address => {
  const address = result.address || {};
  const streetParts = [address.house_number, address.road].filter(Boolean);
  const latitude = Number.parseFloat(result.lat);
  const longitude = Number.parseFloat(result.lon);

  return {
    street: streetParts.length > 0 ? streetParts.join(' ') : result.display_name.split(',')[0]?.trim() || '',
    city: address.city || address.town || address.village || address.municipality || address.county || '',
    state: address.state || '',
    zipCode: address.postcode || '',
    latitude: Number.isFinite(latitude) ? latitude : 0,
    longitude: Number.isFinite(longitude) ? longitude : 0,
    country: address.country || 'USA',
  };
};

export default function TenderPackageFormView({
  editingPackage,
  currentStep,
  onSaveAndContinue,
  onSaveAndExit,
  onCancel,
}: TenderPackageFormViewProps) {
  const STEP_ORDER = [1, 2, 3, 4, 5, 6, 7] as const;
  const TOTAL_STEPS = 7;
  const STEP_LABELS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
    1: 'Primary Information',
    2: 'Document Upload',
    3: 'Work Scoping & Contractor Shortlisting',
    4: 'Bid Invitation',
    5: 'Bid Review',
    6: 'Finalized',
    7: 'Closed',
  };
  const STEP_STATUS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, TenderPackage['status']> = {
    1: 'Draft',
    2: 'Draft',
    3: 'Work Scoping & Contractor Shortlisting',
    4: 'Bid Invitation',
    5: 'Bid Review',
    6: 'Finalized',
    7: 'Closed',
  };

  const [formData, setFormData] = useState({
    packageName: editingPackage?.packageName || '',
    packageControlNumber: editingPackage?.packageControlNumber || getNextPackageControlNumber(),
    workflowStage: editingPackage?.workflowStage || currentStep,
    siteAddress: editingPackage?.siteAddress || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      latitude: 0,
      longitude: 0,
      country: 'USA',
    },
    customerName: editingPackage?.customerName || '',
    customerContactDetails: editingPackage?.customerContactDetails || {
      name: '',
      email: '',
      phone: '',
      mobile: '',
      title: '',
    },
    documents: editingPackage?.documents || [],
    status: (editingPackage?.status || 'Draft') as
      | 'Draft'
      | 'Work Scoping & Contractor Shortlisting'
      | 'Bid Invitation'
      | 'Bid Review'
      | 'Finalized'
      | 'Closed',
  });

  const [uploadedDocuments, setUploadedDocuments] = useState(
    editingPackage?.documents.map((doc) => ({
      ...doc,
      file: null as File | null,
    })) || []
  );

  const [addressSuggestions, setAddressSuggestions] = useState<NominatimSearchResult[]>([]);
  const [isAddressSearchLoading, setIsAddressSearchLoading] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState('');
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const mapEmbedUrl = getOpenStreetMapEmbedUrl(formData.siteAddress.latitude, formData.siteAddress.longitude);

  useEffect(() => {
    const query = formData.siteAddress.street.trim();

    if (query.length < 3) {
      setAddressSuggestions([]);
      setAddressSearchError('');
      setIsAddressSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsAddressSearchLoading(true);
      setAddressSearchError('');

      void fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`,
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Address lookup failed with status ${response.status}`);
          }
          return response.json() as Promise<NominatimSearchResult[]>;
        })
        .then((results) => {
          setAddressSuggestions(results);
          setIsAddressDropdownOpen(true);
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          setAddressSearchError('Unable to load address suggestions right now.');
          setAddressSuggestions([]);
        })
        .finally(() => {
          setIsAddressSearchLoading(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [formData.siteAddress.street]);

  const handleAddressChange = (field: keyof Address, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      siteAddress: {
        ...prev.siteAddress,
        [field]: field === 'latitude' || field === 'longitude' ? Number.parseFloat(String(value)) || 0 : value,
      },
    }));
  };

  const handleAddressSuggestionSelect = (result: NominatimSearchResult) => {
    const nextAddress = buildSiteAddressFromNominatim(result);

    setFormData((prev) => ({
      ...prev,
      siteAddress: nextAddress,
    }));

    setAddressSuggestions([]);
    setIsAddressDropdownOpen(false);
    setAddressSearchError('');
  };

  const handleContactChange = (field: keyof ContactDetails, value: string) => {
    setFormData({
      ...formData,
      customerContactDetails: {
        ...formData.customerContactDetails,
        [field]: value,
      },
    });
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, docType: 'confidential' | 'reference') => {
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

  const validatePrimaryInformation = () => {
    if (
      !formData.packageName ||
      !formData.siteAddress.street ||
      !formData.siteAddress.city ||
      !formData.customerName ||
      !formData.customerContactDetails.name
    ) {
      alert('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const buildPackageToSave = (): TenderPackage => {
    return {
      id: editingPackage?.id || `tp-${Date.now()}`,
      ...formData,
      workflowStage: currentStep,
      status: STEP_STATUS[currentStep],
      documents: uploadedDocuments.map(({ file, ...doc }) => {
        void file;
        return doc;
      }),
      createdAt: editingPackage?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validatePrimaryInformation()) return;
    if (currentStep < TOTAL_STEPS) {
      const nextStep = (currentStep + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      onSaveAndContinue(buildPackageToSave(), nextStep);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      const previousStep = (currentStep - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      onSaveAndContinue(buildPackageToSave(), previousStep);
    }
  };

  const handleSaveAndExit = () => {
    if (!validatePrimaryInformation()) return;

    onSaveAndExit(buildPackageToSave());
  };

  void STEP_ORDER;

  return (
    <div className={`flex flex-col h-full w-full ${currentStep === 3 ? 'p-0 overflow-hidden' : 'p-6 overflow-auto'}`}>
      {/* Step 1: Primary Information */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Primary Information</h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Package Name *</label>
              <input
                type="text"
                value={formData.packageName}
                onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Package Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Package Control Number</label>
              <div>
                <input
                  type="text"
                  value={formData.packageControlNumber}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-700 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">Auto-generated format: TP-&lt;seq&gt;-&lt;date&gt;</p>
              </div>
            </div>
          </div>

          {/* Site Address */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Site Address *</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.siteAddress.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  onFocus={() => setIsAddressDropdownOpen(addressSuggestions.length > 0)}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setIsAddressDropdownOpen(false);
                    }, 120);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Address Line"
                />
                {isAddressDropdownOpen && (addressSuggestions.length > 0 || isAddressSearchLoading || !!addressSearchError) && (
                  <div className="border border-slate-200 rounded-lg bg-white shadow-sm max-h-56 overflow-auto">
                    {isAddressSearchLoading && (
                      <p className="px-3 py-2 text-sm text-slate-500">Searching addresses...</p>
                    )}
                    {!isAddressSearchLoading &&
                      addressSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.lat}-${suggestion.lon}-${suggestion.display_name}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddressSuggestionSelect(suggestion);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                          title={suggestion.display_name}
                        >
                          {suggestion.display_name}
                        </button>
                      ))}
                    {!isAddressSearchLoading && !addressSearchError && addressSuggestions.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-500">No address matches found.</p>
                    )}
                    {!isAddressSearchLoading && addressSearchError && (
                      <p className="px-3 py-2 text-sm text-red-600">{addressSearchError}</p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={formData.siteAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.siteAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={formData.siteAddress.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Zip Code"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={formData.siteAddress.latitude}
                    onChange={(e) => handleAddressChange('latitude', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Latitude"
                    step="0.000001"
                  />
                  <input
                    type="number"
                    value={formData.siteAddress.longitude}
                    onChange={(e) => handleAddressChange('longitude', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Longitude"
                    step="0.000001"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 min-h-80">
                <div className="px-3 py-2 border-b border-slate-200 bg-white">
                  <p className="text-sm font-medium text-slate-700">Location Preview</p>
                  <p className="text-xs text-slate-500">
                    Lat: {formData.siteAddress.latitude || 0} | Long: {formData.siteAddress.longitude || 0}
                  </p>
                </div>
                {mapEmbedUrl ? (
                  <iframe
                    title="Site Address Map"
                    src={mapEmbedUrl}
                    className="w-full h-70"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="h-70 flex items-center justify-center px-4 text-center text-sm text-slate-500">
                    Enter valid latitude and longitude to preview the location on OpenStreetMap.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Customer Information *</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Customer Name *"
              />
              <input
                type="text"
                value={formData.customerContactDetails.title}
                onChange={(e) => handleContactChange('title', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Title (Optional)"
              />
            </div>

            <h4 className="text-sm font-medium text-slate-700 mb-3">Contact Details</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.customerContactDetails.name}
                onChange={(e) => handleContactChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contact Name *"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  value={formData.customerContactDetails.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email *"
                />
                <input
                  type="tel"
                  value={formData.customerContactDetails.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone"
                />
              </div>
              <input
                type="tel"
                value={formData.customerContactDetails.mobile}
                onChange={(e) => handleContactChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mobile (Optional)"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Documents */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Confidential & Reference Documents</h2>

          {/* Confidential Documents */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Confidential Documents</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 mb-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
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

          {/* Reference Documents */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Reference Documents</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 mb-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
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
      )}

      {currentStep >= 3 && currentStep !== 3 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">{STEP_LABELS[currentStep]}</h2>
          <p className="text-slate-600">
            This stage sets package status to <span className="font-semibold">{STEP_STATUS[currentStep]}</span>.
            Clicking Save &amp; Exit will return to the Tender Package list.
          </p>
        </div>
      )}

      {currentStep === 3 && (
        <div className="flex-1 border-t border-slate-200 overflow-hidden bg-slate-50 w-full min-w-0">
          <SelectionView />
        </div>
      )}

      {/* Action Buttons */}
      <div className={currentStep === 3 ? 'space-y-3 px-4 pt-3 pb-4 bg-white border-t border-slate-200' : 'space-y-3'}>
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <Button
            onClick={onCancel}
            className="px-6 py-2 border border-slate-300 rounded-lg text-xs xl:text-sm text-slate-700 font-medium hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAndExit}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs xl:text-sm font-medium transition-colors"
          >
            Save & Exit
          </Button>
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          <Button
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-slate-300 rounded-lg text-xs xl:text-sm text-slate-700 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep > 1
              ? `Previous: ${STEP_LABELS[(currentStep - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7]}`
              : 'Previous'}
          </Button>
          <Button
            onClick={handleNextStep}
            disabled={currentStep === TOTAL_STEPS}
            className="px-6 py-2 border border-blue-300 text-blue-700 rounded-lg text-xs xl:text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep < TOTAL_STEPS
              ? `Next: ${STEP_LABELS[(currentStep + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7]}`
              : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
