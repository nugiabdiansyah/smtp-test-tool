// client/src/components/SmtpForm.jsx
import { useState } from 'react'
import PresetToggle from './PresetToggle.jsx'

const PORT_PRESETS = [
  { value: '25',   label: '25' },
  { value: '2525', label: '2525' },
  { value: '465',  label: '465' },
  { value: '587',  label: '587' },
]

// presets: array from GET /api/presets, shape: { name, host, port, security }
// onTest: async (formData) => { errors? }
// isLoading: bool
export default function SmtpForm({ presets, onTest, isLoading }) {
  const [form, setForm] = useState({
    host: '', port: '', security: '', username: '', password: '', from: '', to: '',
  })
  const [activePreset, setActivePreset] = useState(null)
  const [activePort, setActivePort] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const serverPresetOptions = presets.map(p => ({
    value: p.name,
    label: p.name,
    host: p.host,
    port: String(p.port),
    security: p.security,
  }))

  const handleServerPreset = (opt) => {
    setForm(f => ({ ...f, host: opt.host, port: opt.port, security: opt.security }))
    setActivePreset(opt.value)
    setActivePort(opt.port)
  }

  const handlePortPreset = (opt) => {
    setForm(f => ({ ...f, port: opt.value }))
    setActivePort(opt.value)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'host' && value !== presets.find(p => p.name === activePreset)?.host) {
      setActivePreset(null)
    }
    if (name === 'port') {
      setActivePort(value)
      const currentPreset = presets.find(p => p.name === activePreset)
      if (currentPreset && value !== String(currentPreset.port)) {
        setActivePreset(null)
      }
    }
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await onTest({ ...form, port: Number(form.port) })
    if (result?.errors) {
      setFieldErrors(result.errors)
    }
  }

  const isHostAutofilled = activePreset !== null && form.host !== ''
  const isPortAutofilled = PORT_PRESETS.some(p => p.value === activePort) && form.port !== ''

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>

      <div className="field-group field-group-server">
        <label htmlFor="host">SMTP Server</label>
        <input
          id="host"
          name="host"
          type="text"
          placeholder="e.g. smtp.sendgrid.net"
          value={form.host}
          onChange={handleChange}
          className={isHostAutofilled ? 'autofilled' : ''}
          autoComplete="off"
        />
        {fieldErrors.host && <p className="field-error">{fieldErrors.host}</p>}
        <PresetToggle
          options={serverPresetOptions}
          activeValue={activePreset}
          onSelect={handleServerPreset}
        />
      </div>

      <div className="field-group field-group-port">
        <label htmlFor="port">Port</label>
        <input
          id="port"
          name="port"
          type="text"
          placeholder="e.g. 587"
          value={form.port}
          onChange={handleChange}
          className={isPortAutofilled ? 'autofilled' : ''}
          autoComplete="off"
        />
        {fieldErrors.port && <p className="field-error">{fieldErrors.port}</p>}
        <PresetToggle
          options={PORT_PRESETS}
          activeValue={activePort}
          onSelect={handlePortPreset}
        />
      </div>

      <div className="field-group field-group-security">
        <label htmlFor="security">Security</label>
        <select id="security" name="security" value={form.security} onChange={handleChange}>
          <option value="" disabled>Select security type</option>
          <option value="auto">Auto</option>
          <option value="none">None</option>
          <option value="ssl">SSL</option>
          <option value="tls">TLS</option>
        </select>
        {fieldErrors.security && <p className="field-error">{fieldErrors.security}</p>}
      </div>

      <div className="field-group field-group-username">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          autoComplete="username"
        />
        {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}
      </div>

      <div className="field-group field-group-password">
        <label htmlFor="password">Password</label>
        <div className="password-wrapper">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
      </div>

      <div className="field-group field-group-from">
        <label htmlFor="from">From email address</label>
        <input
          id="from"
          name="from"
          type="email"
          placeholder="From email address"
          value={form.from}
          onChange={handleChange}
        />
        {fieldErrors.from && <p className="field-error">{fieldErrors.from}</p>}
      </div>

      <div className="field-group field-group-to">
        <label htmlFor="to">To email address</label>
        <input
          id="to"
          name="to"
          type="email"
          placeholder="To email address"
          value={form.to}
          onChange={handleChange}
        />
        {fieldErrors.to && <p className="field-error">{fieldErrors.to}</p>}
      </div>

      <div className="field-group-submit">
      <button type="submit" className="btn-test" disabled={isLoading}>
        {isLoading && <span className="spinner" />}
        {isLoading ? 'Testing...' : 'Test it'}
      </button>
      </div>

    </form>
  )
}
