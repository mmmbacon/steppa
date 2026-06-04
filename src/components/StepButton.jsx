function StepButton({ activeStep, emphasized, enabled, label, onClick }) {
  const className = [
    'step-button',
    enabled ? 'is-enabled' : '',
    activeStep ? 'is-current' : '',
    emphasized ? 'is-emphasized' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      aria-label={label}
      aria-pressed={enabled}
      className={className}
      onClick={onClick}
      type="button"
    >
      <span />
    </button>
  );
}

export default StepButton;