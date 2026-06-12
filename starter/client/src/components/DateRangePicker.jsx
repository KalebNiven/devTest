// A basic date range picker that WORKS but lacks accessibility.
// Candidate should add: keyboard navigation, ARIA labels, focus management,
// and screen reader announcements.
function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <div
          className="relative"
          onClick={() => {
            // Using a div wrapper with click handler instead of proper label association
            // This is an accessibility anti-pattern the candidate should notice
          }}
        >
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="text-gray-400 pb-2">to</div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate || undefined}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {(startDate || endDate) && (
        <button
          onClick={() => {
            onStartDateChange("");
            onEndDateChange("");
          }}
          className="text-sm text-gray-500 hover:text-gray-700 pb-2"
        >
          Clear dates
        </button>
      )}
    </div>
  );
}

export default DateRangePicker;
