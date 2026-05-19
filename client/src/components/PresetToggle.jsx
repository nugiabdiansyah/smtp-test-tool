// client/src/components/PresetToggle.jsx
// Renders a row of compact toggle buttons.
// options: [{ value: string, label: string, ...rest }]
// activeValue: the currently selected value (highlights matching button)
// onSelect: called with the full option object when a button is clicked
export default function PresetToggle({ options, activeValue, onSelect }) {
  return (
    <div className="preset-toggle">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`preset-btn${activeValue === opt.value ? ' active' : ''}`}
          onClick={() => onSelect(opt)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
