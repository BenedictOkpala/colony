import { TaskDefinition } from '../types/colony';

export class TaskManager {
  private tasks: TaskDefinition[] = [
    {
      id: 'generator_calibrate',
      name: 'Calibrate Generator Power Core',
      room: 'generator',
      x: 8.5 * 32,
      y: 18 * 32,
      isCompleted: false
    }
  ];

  public onTaskUpdated?: (completedCount: number, totalCount: number) => void;

  public getTasks(): TaskDefinition[] {
    return this.tasks;
  }

  public getTask(id: string): TaskDefinition | undefined {
    return this.tasks.find(t => t.id === id);
  }

  public getCompletedCount(): number {
    return this.tasks.filter(t => t.isCompleted).length;
  }

  public getTotalCount(): number {
    return this.tasks.length;
  }

  public completeTask(id: string): boolean {
    const task = this.getTask(id);
    if (task && !task.isCompleted) {
      task.isCompleted = true;
      if (this.onTaskUpdated) {
        this.onTaskUpdated(this.getCompletedCount(), this.getTotalCount());
      }
      return true;
    }
    return false;
  }
}

