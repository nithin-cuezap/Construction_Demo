import Button from '../components/Button';
import type { TenderPackage } from '../types';

interface TenderPackageListViewProps {
  packages: TenderPackage[];
  onAddNew: () => void;
  onEdit: (packageId: string) => void;
  onDelete: (packageId: string) => void;
}

export default function TenderPackageListView({
  packages,
  onAddNew,
  onEdit,
  onDelete,
}: TenderPackageListViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Work Scoping & Contractor Shortlisting':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Bid Invitation':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Bid Review':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Finalized':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Tender Packages</h1>
        <Button
          onClick={onAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add New Package
        </Button>
      </div>

      {packages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-slate-600 mb-4">No tender packages yet</p>
            <Button
              onClick={onAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First Package
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-auto flex-1 rounded-lg border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200">
                  Package Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200">
                  Control Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">{pkg.packageName}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-mono">{pkg.packageControlNumber}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <div>{pkg.customerName}</div>
                    <div className="text-xs text-slate-500">{pkg.customerContactDetails.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <div>{pkg.siteAddress.city}, {pkg.siteAddress.state}</div>
                    <div className="text-xs text-slate-500">{pkg.siteAddress.zipCode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                        pkg.status
                      )}`}
                    >
                      {pkg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {new Date(pkg.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onEdit(pkg.id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded transition-colors font-medium"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => onDelete(pkg.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors font-medium"
                      >
                        Delete
                      </Button>
                    </div>
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
