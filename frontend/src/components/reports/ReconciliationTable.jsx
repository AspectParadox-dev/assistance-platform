import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ReconciliationTable({ donations = [], disbursements = [], totalIn = 0, totalOut = 0, balance = 0 }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Donations (Inflow)</h4>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Donor</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {donations.map((d) => (
              <tr key={d.id}>
                <td className="px-3 py-2">{d.donorName}</td>
                <td className="px-3 py-2">{formatDate(d.receivedDate)}</td>
                <td className="px-3 py-2 text-right text-green-700 font-medium">{formatCurrency(d.amount)}</td>
              </tr>
            ))}
            <tr className="bg-green-50 font-semibold">
              <td colSpan={2} className="px-3 py-2">Total In</td>
              <td className="px-3 py-2 text-right text-green-700">{formatCurrency(totalIn)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Disbursements (Outflow)</h4>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Application</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Paid Date</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {disbursements.map((d) => (
              <tr key={d.id}>
                <td className="px-3 py-2">{d.application?.referenceNumber || '—'}</td>
                <td className="px-3 py-2">{formatDate(d.paidDate)}</td>
                <td className="px-3 py-2 text-right text-red-700 font-medium">{formatCurrency(d.amount)}</td>
              </tr>
            ))}
            <tr className="bg-red-50 font-semibold">
              <td colSpan={2} className="px-3 py-2">Total Out</td>
              <td className="px-3 py-2 text-right text-red-700">{formatCurrency(totalOut)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="lg:col-span-2">
        <div className={`rounded-lg p-4 text-center font-bold text-lg ${balance >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          Balance: {formatCurrency(balance)}
        </div>
      </div>
    </div>
  );
}
