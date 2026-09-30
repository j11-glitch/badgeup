import { useState, type FormEvent } from 'react'
import { DEFAULT_BADGE_COLOR, LIMITS, validateBadge, type BadgeInput } from '../../domain/validation'
import { EMOJI_CHOICES } from './emoji'

interface BadgeFormProps {
  initial?: BadgeInput
  submitLabel: string
  onSave: (badge: BadgeInput) => Promise<void>
  onCancel?: () => void
}

const EMPTY: BadgeInput = { name: '', description: '', emoji: EMOJI_CHOICES[0], color: DEFAULT_BADGE_COLOR }

export function BadgeForm({ initial = EMPTY, submitLabel, onSave, onCancel }: BadgeFormProps) {
  const [values, setValues] = useState<BadgeInput>(initial)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const set = (field: keyof BadgeInput) => (value: string) => setValues((v) => ({ ...v, [field]: value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateBadge(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setSaving(true)
    setErrors([])
    try {
      await onSave(result.badge)
      if (!onCancel) setValues(EMPTY)
    } catch {
      setErrors(['Could not save the badge. Please try again.'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="badge-form" onSubmit={submit}>
      <div className="field">
        <span className="field__label">Emoji</span>
        <div className="emoji-picker" role="group" aria-label="Emoji">
          {EMOJI_CHOICES.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-choice"
              aria-pressed={values.emoji === emoji}
              onClick={() => set('emoji')(emoji)}
            >
              {emoji}
            </button>
          ))}
          <input
            aria-label="Other emoji"
            className="emoji-input"
            value={values.emoji}
            maxLength={LIMITS.badgeEmoji}
            onChange={(event) => set('emoji')(event.target.value)}
          />
        </div>
      </div>
      <label className="field">
        <span className="field__label">Name</span>
        <input value={values.name} maxLength={LIMITS.badgeName} onChange={(event) => set('name')(event.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Description (optional)</span>
        <input
          value={values.description}
          maxLength={LIMITS.badgeDescription}
          onChange={(event) => set('description')(event.target.value)}
        />
      </label>
      <label className="field field--inline">
        <span className="field__label">Colour</span>
        <input type="color" value={values.color} onChange={(event) => set('color')(event.target.value)} />
      </label>
      {errors.length > 0 && (
        <ul className="error" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <div className="form-actions">
        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="button button--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
