import { BasePage } from './BasePage';
import type { Page, Locator } from '@playwright/test';

export class KanbanPage extends BasePage {
  // Columns
  private readonly todoColumn: Locator;
  private readonly inProgressColumn: Locator;
  private readonly doneColumn: Locator;

  // Task creation modal
  private readonly createTaskModal: Locator;
  private readonly taskTitleInput: Locator;
  private readonly taskDescriptionInput: Locator;
  private readonly taskPrioritySelect: Locator;
  private readonly taskDeadlineInput: Locator;
  private readonly taskLabelsInput: Locator;
  private readonly saveTaskButton: Locator;
  private readonly cancelTaskButton: Locator;

  // Task actions
  private readonly taskCards: Locator;
  private readonly taskDetailModal: Locator;
  private readonly editTaskButton: Locator;
  private readonly deleteTaskButton: Locator;
  private readonly confirmDeleteButton: Locator;

  // Filters and controls
  private readonly refreshButton: Locator;
  private readonly filterButton: Locator;
  private readonly sortButton: Locator;
  private readonly viewButton: Locator;

  // Stats
  private readonly totalTasksCount: Locator;
  private readonly todoCount: Locator;
  private readonly inProgressCount: Locator;
  private readonly doneCount: Locator;

  constructor(page: Page) {
    super(page);

    // Columns
    this.todoColumn = page.locator('[data-testid="column-todo"]');
    this.inProgressColumn = page.locator('[data-testid="column-inprogress"]');
    this.doneColumn = page.locator('[data-testid="column-done"]');

    // Task creation modal
    this.createTaskModal = page.locator('[data-testid="create-task-modal"]');
    this.taskTitleInput = page.getByLabel('عنوان وظیفه');
    this.taskDescriptionInput = page.getByLabel('توضیحات');
    this.taskPrioritySelect = page.getByLabel('اولویت');
    this.taskDeadlineInput = page.getByLabel('تاریخ پایان');
    this.taskLabelsInput = page.getByLabel('برچسب‌ها');
    this.saveTaskButton = page.getByRole('button', { name: 'ذخیره' });
    this.cancelTaskButton = page.getByRole('button', { name: 'لغو' });

    // Task actions
    this.taskCards = page.locator('[data-testid="task-card"]');
    this.taskDetailModal = page.locator('[data-testid="task-detail-modal"]');
    this.editTaskButton = page.getByRole('button', { name: 'ویرایش' });
    this.deleteTaskButton = page.getByRole('button', { name: 'حذف' });
    this.confirmDeleteButton = page.getByRole('button', { name: 'تایید حذف' });

    // Filters and controls
    this.refreshButton = page.getByRole('button', { name: 'بروزرسانی' });
    this.filterButton = page.getByRole('button', { name: 'فیلتر' });
    this.sortButton = page.getByRole('button', { name: 'ترتیب' });
    this.viewButton = page.getByRole('button', { name: 'نمای' });

    // Stats
    this.totalTasksCount = page.locator('[data-testid="total-tasks-count"]');
    this.todoCount = page.locator('[data-testid="todo-count"]');
    this.inProgressCount = page.locator('[data-testid="inprogress-count"]');
    this.doneCount = page.locator('[data-testid="done-count"]');
  }

  async createTask(taskData: {
    title: string;
    description?: string;
    priority?: string;
    deadline?: string;
    labels?: string[];
  }): Promise<void> {
    // Click create task button
    await this.page.getByRole('button', { name: 'وظیفه جدید' }).click();

    // Wait for modal
    await this.createTaskModal.waitFor({ state: 'visible' });

    // Fill form
    await this.taskTitleInput.fill(taskData.title);

    if (taskData.description) {
      await this.taskDescriptionInput.fill(taskData.description);
    }

    if (taskData.priority) {
      await this.taskPrioritySelect.selectOption(taskData.priority);
    }

    if (taskData.deadline) {
      await this.taskDeadlineInput.fill(taskData.deadline);
    }

    if (taskData.labels && taskData.labels.length > 0) {
      // Assuming labels are selected from a dropdown or multi-select
      for (const label of taskData.labels) {
        await this.page.getByText(label).click();
      }
    }

    // Save task
    await this.saveTaskButton.click();

    // Wait for modal to close
    await this.createTaskModal.waitFor({ state: 'hidden' });
  }

  async getTaskCount(): Promise<number> {
    return await this.taskCards.count();
  }

  async getTasksInColumn(column: 'todo' | 'inprogress' | 'done'): Promise<number> {
    const columnLocator = column === 'todo' ? this.todoColumn :
                         column === 'inprogress' ? this.inProgressColumn :
                         this.doneColumn;
    return await columnLocator.locator('[data-testid="task-card"]').count();
  }

  async dragTaskToColumn(taskTitle: string, targetColumn: 'todo' | 'inprogress' | 'done'): Promise<void> {
    const taskCard = this.page.locator('[data-testid="task-card"]').filter({ hasText: taskTitle });
    const targetColumnLocator = targetColumn === 'todo' ? this.todoColumn :
                               targetColumn === 'inprogress' ? this.inProgressColumn :
                               this.doneColumn;

    await taskCard.dragTo(targetColumnLocator);
  }

  async openTaskDetails(taskTitle: string): Promise<void> {
    const taskCard = this.page.locator('[data-testid="task-card"]').filter({ hasText: taskTitle });
    await taskCard.click();
    await this.taskDetailModal.waitFor({ state: 'visible' });
  }

  async editTask(taskTitle: string, updates: Partial<{
    title: string;
    description: string;
    priority: string;
    deadline: string;
  }>): Promise<void> {
    await this.openTaskDetails(taskTitle);
    await this.editTaskButton.click();

    if (updates.title) {
      await this.taskTitleInput.fill(updates.title);
    }

    if (updates.description) {
      await this.taskDescriptionInput.fill(updates.description);
    }

    if (updates.priority) {
      await this.taskPrioritySelect.selectOption(updates.priority);
    }

    if (updates.deadline) {
      await this.taskDeadlineInput.fill(updates.deadline);
    }

    await this.saveTaskButton.click();
    await this.taskDetailModal.waitFor({ state: 'hidden' });
  }

  async deleteTask(taskTitle: string): Promise<void> {
    await this.openTaskDetails(taskTitle);
    await this.deleteTaskButton.click();
    await this.confirmDeleteButton.click();
    await this.taskDetailModal.waitFor({ state: 'hidden' });
  }

  async refreshTasks(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForLoad();
  }

  async getTotalTasksCount(): Promise<number> {
    const text = await this.totalTasksCount.textContent();
    return parseInt(text || '0');
  }

  async getColumnStats(): Promise<{
    todo: number;
    inprogress: number;
    done: number;
  }> {
    const [todo, inprogress, done] = await Promise.all([
      this.getTasksInColumn('todo'),
      this.getTasksInColumn('inprogress'),
      this.getTasksInColumn('done')
    ]);

    return { todo, inprogress, done };
  }

  async isTaskVisible(taskTitle: string): Promise<boolean> {
    const taskCard = this.page.locator('[data-testid="task-card"]').filter({ hasText: taskTitle });
    return await taskCard.isVisible();
  }

  async takeKanbanScreenshot(name: string): Promise<void> {
    await this.takeScreenshot(`kanban_${name}`);
  }
}
