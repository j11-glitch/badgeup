import type { Child } from '../../data/users'
import { FOUNDER, LEVELS, MANUAL_BADGE_IDS, MANUAL_BADGES, MANUAL_MILESTONES, TASK_BADGES } from '../../domain/catalog'
import { BIG_STREAK_DAYS, STREAK_DAYS } from '../../domain/progress'
import type { ChildProgress } from '../../useChildProgress'
import { BadgeTile } from '../BadgeTile'
import { nb } from '../../i18n/nb'

const daysToGo = nb.daysToGo

/** Every badge for one child, grouped like the badge sheet; earned ones light up. */
export function BadgeSections({ child, progress }: { child: Child; progress: ChildProgress }) {
  const { tasks, manual } = progress
  const nextLevel = LEVELS[tasks.level + 1]

  return (
    <>
      <section className="panel">
        <h2>{nb.sectionLevels}</h2>
        <ul className="tiles tiles--levels">
          {LEVELS.map((level, i) => (
            <BadgeTile
              key={level.id}
              badge={level}
              earned={i <= tasks.level}
              detail={level === nextLevel ? daysToGo(level.days - tasks.run) : undefined}
            />
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>{nb.sectionTasks}</h2>
        <ul className="tiles">
          <BadgeTile badge={TASK_BADGES.onARoll} earned={tasks.onARoll} />
          <BadgeTile
            badge={TASK_BADGES.streak}
            earned={tasks.streak}
            detail={tasks.streak ? undefined : daysToGo(STREAK_DAYS - tasks.run)}
          />
          <BadgeTile
            badge={TASK_BADGES.bigStreak}
            earned={tasks.bigStreak}
            detail={tasks.bigStreak ? undefined : daysToGo(BIG_STREAK_DAYS - tasks.run)}
          />
        </ul>
      </section>

      <section className="panel">
        <h2>
          {nb.sectionManual} <span className="pill">{manual.count} / {MANUAL_BADGE_IDS.length}</span>
        </h2>
        <ul className="tiles">
          {MANUAL_BADGE_IDS.map((id) => (
            <BadgeTile key={id} badge={MANUAL_BADGES[id]} earned={child.manual[id] !== undefined} />
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>{nb.sectionSpecial}</h2>
        <ul className="tiles">
          <BadgeTile badge={MANUAL_MILESTONES.milestone} earned={manual.milestone} />
          <BadgeTile
            badge={MANUAL_MILESTONES.master}
            earned={manual.master}
            detail={manual.daysToMaster !== null ? daysToGo(manual.daysToMaster) : undefined}
          />
          <BadgeTile badge={FOUNDER} earned={child.diamonds > 0} count={child.diamonds} />
        </ul>
      </section>
    </>
  )
}
