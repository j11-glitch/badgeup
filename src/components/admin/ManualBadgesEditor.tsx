import { setManualBadge, type Child } from '../../data/users'
import { MANUAL_BADGE_IDS, MANUAL_BADGES, type ManualBadgeId } from '../../domain/catalog'
import { nb } from '../../i18n/nb'
import { DiamondsEditor } from './DiamondsEditor'

/** Give and take away manual badges and Founder diamonds. */
export function ManualBadgesEditor({ child, onError }: { child: Child; onError: (message: string) => void }) {
  async function toggle(id: ManualBadgeId, given: boolean) {
    const badge = MANUAL_BADGES[id]
    if (!given && !window.confirm(nb.takeBadgeConfirm(badge.name, child.name))) return
    try {
      await setManualBadge(child.id, id, given)
    } catch {
      onError(nb.badgeFailed)
    }
  }

  return (
    <div className="editor">
      <h4>{nb.manualBadges}</h4>
      <p className="muted small">{nb.manualHint}</p>
      <div className="award-grid" role="group" aria-label={nb.manualFor(child.name)}>
        {MANUAL_BADGE_IDS.map((id) => {
          const given = child.manual[id] !== undefined
          const badge = MANUAL_BADGES[id]
          return (
            <button
              key={id}
              type="button"
              className={`award${given ? ' award--on' : ''}`}
              aria-pressed={given}
              title={badge.rule}
              onClick={() => void toggle(id, !given)}
            >
              <img src={badge.icon} alt="" width={36} height={36} />
              <span>
                {badge.name}
                <span className="award__rule">{badge.rule}</span>
              </span>
            </button>
          )
        })}
      </div>

      <DiamondsEditor child={child} onError={onError} />
    </div>
  )
}
