import { useState } from 'react'
import { setTaskDone } from '../../data/days'
import type { Child } from '../../data/users'
import { TASK_BADGES } from '../../domain/catalog'
import type { DayKey, DayRecord } from '../../domain/progress'
import { nb } from '../../i18n/nb'

interface TodayTasksProps {
  readonly child: Child
  readonly today: DayKey
  readonly record: DayRecord | undefined
}

const RING = 2 * Math.PI * 26

/** Today's checklist. Children tick off their own tasks, no login needed. */
export function TodayTasks({ child, today, record }: TodayTasksProps) {
  const [error, setError] = useState<string | null>(null)
  const done = new Set(record?.done ?? [])
  const required = child.tasks.map((t) => t.id)
  const count = child.tasks.filter((t) => done.has(t.id)).length
  const total = child.tasks.length
  const allDone = total > 0 && count === total

  async function toggle(taskId: string, checked: boolean) {
    setError(null)
    try {
      await setTaskDone(child.id, today, required, record, taskId, checked)
    } catch {
      setError(nb.saveFailed)
    }
  }

  return (
    <section className={`panel today${allDone ? ' today--done' : ''}`}>
      <div className="today__head">
        <div>
          <h2>{nb.todaysTasks}</h2>
          <p className="muted small">
            {total === 0
              ? nb.noTasks
              : allDone
                ? nb.allDoneRoll
                : nb.tasksLeft(total - count)}
          </p>
        </div>
        {total > 0 && (
          <span className="ring" aria-label={nb.doneOf(count, total)}>
            {allDone ? (
              <img src={TASK_BADGES.onARoll.icon} alt="" width={60} height={60} className="ring__badge" />
            ) : (
              <svg viewBox="0 0 60 60" width={60} height={60} aria-hidden="true">
                <circle cx="30" cy="30" r="26" className="ring__track" />
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  className="ring__fill"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - count / total)}
                />
                <text x="30" y="35" textAnchor="middle" className="ring__text">
                  {count}/{total}
                </text>
              </svg>
            )}
          </span>
        )}
      </div>

      {total > 0 && (
        <ul className="checklist">
          {child.tasks.map((task) => {
            const checked = done.has(task.id)
            return (
              <li key={task.id}>
                <label className={`check${checked ? ' check--done' : ''}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(event) => void toggle(task.id, event.target.checked)}
                  />
                  <span className="check__box" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width={20} height={20}>
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <span className="check__title">{task.title}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
