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
    if (name === 'port' && value !== activePort) {
      setActivePort(value)
    }
    if (fieldErrors[name]) {
      setFieldErrors(e => { const n = { ...e }; delete n[name]; return n })
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

      <div className="field-group">
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

      <div className="field-group">
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

      <div className="field-group">
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

      <div className="field-group">
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

      <div className="field-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
        />
        {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
      </div>

      <div className="field-group">
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

      <div className="field-group">
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

      <button type="submit" className="btn-test" disabled={isLoading}>
        {isLoading && <span className="spinner" />}
        {isLoading ? 'Testing...' : 'Test it'}
      </button>

    </form>
  )
}
