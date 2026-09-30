import { useEffect, useState, type FormEvent } from 'react'
import { changeDiamonds, setDiamonds, type Child } from '../../data/users'
import { FOUNDER } from '../../domain/catalog'
import { LIMITS } from '../../domain/validation'
import { nb } from '../../i18n/nb'

/** Parses the typed number of diamonds; null unless it is a whole number from 0 to the limit. */
export function parseDiamonds(text: string): number | null {
  const clean = text.trim()
  if (!/^\d{1,4}$/.test(clean)) return null
  const count = Number(clean)
  return count <= LIMITS.diamonds ? count : null
}

/** Founder diamonds: step with - and +, or type the number. */
export function DiamondsEditor({ child, onError }: { child: Child; onError: (message: string) => void }) {
  const [text, setText] = useState(String(child.diamonds))
  const typed = parseDiamonds(text)

  // Follow changes from the buttons or from another admin.
  useEffect(() => setText(String(child.diamonds)), [child.diamonds])

  async function step(by: 1 | -1) {
    try {
      await changeDiamonds(child.id, by)
    } catch {
      onError(nb.diamondsFailed)
    }
  }

  async function save(event?: FormEvent) {
    event?.preventDefault()
    if (typed === null) {
      setText(String(child.diamonds))
      onError(nb.diamondsInvalid(LIMITS.diamonds))
      return
    }
    if (typed === child.diamonds) return
    try {
      await setDiamonds(child.id, typed)
    } catch {
      onError(nb.diamondsFailed)
    }
  }

  return (
    <>
      <h4>{nb.diamonds}</h4>
      <form className="stepper" onSubmit={(event) => void save(event)}>
        <img src={FOUNDER.icon} alt="" width={36} height={36} />
        <button
          type="button"
          className="button button--ghost button--small"
          aria-label={nb.takeDiamond(child.name)}
          disabled={child.diamonds <= 0}
          onClick={() => void step(-1)}
        >
          {'−'}
        </button>
        <input
          className="stepper__input"
          inputMode="numeric"
          aria-label={nb.diamondCount(child.name)}
          aria-invalid={typed === null}
          value={text}
          maxLength={4}
          onChange={(event) => setText(event.target.value)}
          onBlur={() => void save()}
        />
        <button
          type="button"
          className="button button--ghost button--small"
          aria-label={nb.giveDiamond(child.name)}
          disabled={child.diamonds >= LIMITS.diamonds}
          onClick={() => void step(1)}
        >
          +
        </button>
      </form>
    </>
  )
}
