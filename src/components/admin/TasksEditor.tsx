import { useState, type FormEvent } from 'react'
import { setTasks, type Child } from '../../data/users'
import { cleanText, LIMITS } from '../../domain/validation'
import { nb } from '../../i18n/nb'

/** Add and remove a child's daily tasks. */
export function TasksEditor({ child, onError }: { child: Child; onError: (message: string) => void }) {
  const [title, setTitle] = useState('')
  const clean = cleanText(title, LIMITS.taskTitle)
  const full = child.tasks.length >= LIMITS.tasksPerUser

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!clean || full) return
    try {
      await setTasks(child.id, [...child.tasks, { id: crypto.randomUUID().slice(0, 8), title: clean }])
      setTitle('')
    } catch {
      onError(nb.addTaskFailed)
    }
  }

  async function remove(id: string, taskTitle: string) {
    if (!window.confirm(nb.removeTaskConfirm(taskTitle, child.name))) return
    try {
      await setTasks(child.id, child.tasks.filter((t) => t.id !== id))
    } catch {
      onError(nb.removeTaskFailed)
    }
  }

  return (
    <div className="editor">
      <h4>{nb.dailyTasks}</h4>
      {child.tasks.length === 0 ? (
        <p className="muted small">{nb.noTasksAdmin}</p>
      ) : (
        <ul className="task-list">
          {child.tasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span>
              <button
                type="button"
                className="button button--danger button--small"
                aria-label={nb.removeNamed(task.title)}
                onClick={() => void remove(task.id, task.title)}
              >
                {nb.remove}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="inline-form" onSubmit={add}>
        <label htmlFor={`task-${child.id}`} className="sr-only">
          {nb.newTaskFor(child.name)}
        </label>
        <input
          id={`task-${child.id}`}
          value={title}
          maxLength={LIMITS.taskTitle}
          placeholder={full ? nb.maxTasks(LIMITS.tasksPerUser) : nb.newTask}
          disabled={full}
          autoComplete="off"
          onChange={(event) => setTitle(event.target.value)}
        />
        <button type="submit" className="button button--small" disabled={!clean || full}>
          {nb.addTask}
        </button>
      </form>
    </div>
  )
}
