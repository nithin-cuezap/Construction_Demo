import { useEffect, useState } from 'react';
import type { Address, ContactDetails } from '../../types';
import type {
    NominatimSearchResult,
    TenderPackageFormData,
} from './TenderPackageForm.types';

interface PrimaryInformationStepProps {
  formData: TenderPackageFormData;
  setFormData: React.Dispatch<React.SetStateAction<TenderPackageFormData>>;
}

const isValidCoordinate = (value: number, min: number, max: number) => 
  Number.isFinite(value) && value >= min && value <= max;

const getOpenStreetMapEmbedUrl = (latitude: number, longitude: number) => {
  if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) {
    return null;
  }

  const latDelta = 0.008;
  const lonDelta = latDelta / Math.cos((latitude * Math.PI) / 180);
  const left = Math.max(-180, longitude - lonDelta);
  const right = Math.min(180, longitude + lonDelta);
  const top = Math.min(90, latitude + latDelta);
  const bottom = Math.max(-90, latitude - latDelta);

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

export default function PrimaryInformationStep({
  formData,
  setFormData,
}: PrimaryInformationStepProps) {
  const [addressSuggestions, setAddressSuggestions] = useState<NominatimSearchResult[]>([]);
  const [isAddressSearchLoading, setIsAddressSearchLoading] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState('');
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [hasStartedAddressTyping, setHasStartedAddressTyping] = useState(false);

  const mapEmbedUrl = getOpenStreetMapEmbedUrl(formData.siteAddress.latitude, formData.siteAddress.longitude);

  useEffect(() => {
    if (!hasStartedAddressTyping) {
      return;
    }

    const query = formData.siteAddress.street.trim();

    if (query.length < 3) {
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
  }, [formData.siteAddress.street, hasStartedAddressTyping]);

  const handleAddressChange = (field: keyof Address, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      siteAddress: {
        ...prev.siteAddress,
        [field]: field === 'latitude' || field === 'longitude' ? Number.parseFloat(String(value)) || 0 : value,
      },
    }));
  };

  const handleStreetInputChange = (value: string) => {
    setHasStartedAddressTyping(true);

    if (value.trim().length < 3) {
      setAddressSuggestions([]);
      setAddressSearchError('');
      setIsAddressSearchLoading(false);
      setIsAddressDropdownOpen(false);
    }

    handleAddressChange('street', value);
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
    setHasStartedAddressTyping(false);
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
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Primary Information</h2>

      <div className="mb-3 rounded-lg border border-blue-200 border-l-4 border-l-blue-500 bg-blue-50/50 p-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-900 mb-2">Package Details *</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Package Name *</label>
            <input
              type="text"
              value={formData.packageName}
              onChange={(e) => setFormData((prev) => ({ ...prev, packageName: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Package Name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Package Control Number</label>
            <div>
              <input
                type="text"
                value={formData.packageControlNumber}
                disabled
                className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-slate-100 text-slate-700 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">Auto-generated format: TP-&lt;seq&gt;-&lt;date&gt;</p>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700 mb-1">Project Description</label>
          <textarea
            value={formData.projectDescription}
            onChange={(e) => setFormData((prev) => ({ ...prev, projectDescription: e.target.value }))}
            className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
            placeholder="Enter project description..."
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tender Submission Due Date</label>
            <input
              type="date"
              value={formData.tenderSubmissionDueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, tenderSubmissionDueDate: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">RFQ Due Date</label>
            <input
              type="date"
              value={formData.rfqDueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, rfqDueDate: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/50 p-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900 mb-2">For Sub Contractors</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Bid Submission Due Date</label>
            <input
              type="date"
              value={formData.subContractorBidSubmissionDueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, subContractorBidSubmissionDueDate: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">RFQ Due Date</label>
            <input
              type="date"
              value={formData.subContractorRfqDueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, subContractorRfqDueDate: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-emerald-200 border-l-4 border-l-emerald-500 bg-emerald-50/50 p-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-900 mb-2">Site Address *</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            <div className="space-y-2">
              <input
                type="text"
                value={formData.siteAddress.street}
                onChange={(e) => handleStreetInputChange(e.target.value)}
                onFocus={() => setIsAddressDropdownOpen(addressSuggestions.length > 0)}
                onBlur={() => {
                  window.setTimeout(() => {
                    setIsAddressDropdownOpen(false);
                  }, 120);
                }}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Address Line"
              />
              {isAddressDropdownOpen && (addressSuggestions.length > 0 || isAddressSearchLoading || !!addressSearchError) && (
                <div className="border border-slate-200 rounded-md bg-white shadow-sm max-h-48 overflow-auto">
                  {isAddressSearchLoading && (
                    <p className="px-2.5 py-1.5 text-xs text-slate-500">Searching addresses...</p>
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
                        className="block w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 transition-colors"
                        title={suggestion.display_name}
                      >
                        {suggestion.display_name}
                      </button>
                    ))}
                  {!isAddressSearchLoading && !addressSearchError && addressSuggestions.length === 0 && (
                    <p className="px-2.5 py-1.5 text-xs text-slate-500">No address matches found.</p>
                  )}
                  {!isAddressSearchLoading && addressSearchError && (
                    <p className="px-2.5 py-1.5 text-xs text-red-600">{addressSearchError}</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.siteAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={formData.siteAddress.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="State"
                />
                <input
                  type="text"
                  value={formData.siteAddress.zipCode}
                  onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Zip Code"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.siteAddress.latitude}
                  onChange={(e) => handleAddressChange('latitude', e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Latitude"
                  step="0.000001"
                />
                <input
                  type="number"
                  value={formData.siteAddress.longitude}
                  onChange={(e) => handleAddressChange('longitude', e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Longitude"
                  step="0.000001"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50 min-h-64">
              <div className="px-2.5 py-1.5 border-b border-slate-200 bg-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Location Preview</p>
                <p className="text-xs text-slate-500">
                  Lat: {formData.siteAddress.latitude || 0} | Long: {formData.siteAddress.longitude || 0}
                </p>
              </div>
              {mapEmbedUrl ? (
                <iframe
                  title="Site Address Map"
                  src={mapEmbedUrl}
                  className="w-full h-56"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="h-56 flex items-center justify-center px-3 text-center text-xs text-slate-500">
                  Enter valid latitude and longitude to preview the location on OpenStreetMap.
                </div>
              )}
            </div>
          </div>
      </div>

      <div className="mb-2 rounded-lg border border-cyan-200 border-l-4 border-l-cyan-500 bg-cyan-50/50 p-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-900 mb-2">Customer Information *</h3>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
            className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Customer Name *"
          />
          <input
            type="text"
            value={formData.customerContactDetails.title}
            onChange={(e) => handleContactChange('title', e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Title (Optional)"
          />
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-2">Contact Details</h4>
        <div className="space-y-2">
          <input
            type="text"
            value={formData.customerContactDetails.name}
            onChange={(e) => handleContactChange('name', e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Contact Name *"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              value={formData.customerContactDetails.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Email *"
            />
            <input
              type="tel"
              value={formData.customerContactDetails.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Phone"
            />
          </div>
          <input
            type="tel"
            value={formData.customerContactDetails.mobile}
            onChange={(e) => handleContactChange('mobile', e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Mobile (Optional)"
          />
        </div>
      </div>
    </div>
  );
}
