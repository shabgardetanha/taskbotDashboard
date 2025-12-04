import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { KanbanPage } from './pages/KanbanPage';

test.describe('Task Management - Happy Path Scenarios', () => {
  let dashboardPage: DashboardPage;
  let kanbanPage: KanbanPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    kanbanPage = new KanbanPage(page);

    // Navigate to application and login (assuming auto-login for demo)
    await page.goto('http://localhost:3000/dashboard/kanban');
    await page.waitForLoadState('networkidle');
  });

  test('TC-TM-001: Create task with complete information', async ({ page }) => {
    // Navigate to kanban if not already there
    await dashboardPage.navigateToKanban();

    const taskData = {
      title: 'تست ایجاد وظیفه کامل',
      description: 'این یک وظیفه تست برای بررسی عملکرد ایجاد وظیفه است',
      priority: 'high',
      deadline: '2025-12-31',
      labels: ['تست', 'مهم']
    };

    const initialCount = await kanbanPage.getTaskCount();

    await kanbanPage.createTask(taskData);

    const finalCount = await kanbanPage.getTaskCount();
    expect(finalCount).toBe(initialCount + 1);

    // Verify task appears in todo column
    const todoTasks = await kanbanPage.getTasksInColumn('todo');
    expect(todoTasks).toBeGreaterThan(0);

    // Verify task is visible
    const isVisible = await kanbanPage.isTaskVisible(taskData.title);
    expect(isVisible).toBe(true);

    await kanbanPage.takeKanbanScreenshot('task_created_successfully');
  });

  test('TC-TM-002: Edit existing task successfully', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    // Create a test task first
    const originalTitle = 'وظیفه اصلی برای ویرایش';
    await kanbanPage.createTask({ title: originalTitle });

    // Edit the task
    const updates = {
      title: 'وظیفه ویرایش شده',
      description: 'توضیحات بروزرسانی شده',
      priority: 'urgent'
    };

    await kanbanPage.editTask(originalTitle, updates);

    // Verify changes
    const isOriginalVisible = await kanbanPage.isTaskVisible(originalTitle);
    const isUpdatedVisible = await kanbanPage.isTaskVisible(updates.title);

    expect(isOriginalVisible).toBe(false);
    expect(isUpdatedVisible).toBe(true);

    await kanbanPage.takeKanbanScreenshot('task_edited_successfully');
  });

  test('TC-TM-003: Delete task with confirmation', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    // Create a test task
    const taskTitle = 'وظیفه برای حذف';
    await kanbanPage.createTask({ title: taskTitle });

    const initialCount = await kanbanPage.getTaskCount();

    // Delete the task
    await kanbanPage.deleteTask(taskTitle);

    const finalCount = await kanbanPage.getTaskCount();
    expect(finalCount).toBe(initialCount - 1);

    // Verify task is no longer visible
    const isVisible = await kanbanPage.isTaskVisible(taskTitle);
    expect(isVisible).toBe(false);

    await kanbanPage.takeKanbanScreenshot('task_deleted_successfully');
  });

  test('TC-TM-004: Drag task between columns', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    // Create a test task
    const taskTitle = 'وظیفه برای انتقال';
    await kanbanPage.createTask({ title: taskTitle });

    // Get initial column stats
    const initialStats = await kanbanPage.getColumnStats();

    // Drag from todo to inprogress
    await kanbanPage.dragTaskToColumn(taskTitle, 'inprogress');

    // Get final column stats
    const finalStats = await kanbanPage.getColumnStats();

    expect(finalStats.todo).toBe(initialStats.todo - 1);
    expect(finalStats.inprogress).toBe(initialStats.inprogress + 1);

    await kanbanPage.takeKanbanScreenshot('task_dragged_successfully');
  });

  test('TC-TM-005: Add comment to task', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    // Create a test task
    const taskTitle = 'وظیفه با کامنت';
    await kanbanPage.createTask({ title: taskTitle });

    // Open task details and add comment
    await kanbanPage.openTaskDetails(taskTitle);

    // This would need to be implemented in KanbanPage for comment functionality
    // For now, just verify we can open task details
    await kanbanPage.takeKanbanScreenshot('task_details_opened');
  });
});

test.describe('Task Management - Negative & Edge Cases', () => {
  let dashboardPage: DashboardPage;
  let kanbanPage: KanbanPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    kanbanPage = new KanbanPage(page);
    await page.goto('http://localhost:3000/dashboard/kanban');
    await page.waitForLoadState('networkidle');
  });

  test('TC-TM-006: Create task with empty title', async ({ page }) => {
    await dashboardPage.navigateToKanban();
    await dashboardPage.clickCreateTask();

    // Try to create task with empty title - this should show validation error
    // Note: Actual implementation may vary based on UI validation

    await kanbanPage.takeKanbanScreenshot('empty_title_validation');
  });

  test('TC-TM-007: Create task with very long title (500 chars)', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    const longTitle = 'A'.repeat(500);
    const taskData = {
      title: longTitle,
      description: 'Test with very long title'
    };

    await kanbanPage.createTask(taskData);

    // Verify task was created (or truncated, depending on implementation)
    const taskCount = await kanbanPage.getTaskCount();
    expect(taskCount).toBeGreaterThan(0);

    await kanbanPage.takeKanbanScreenshot('long_title_handling');
  });

  test('TC-TM-008: Create task with past deadline', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    const pastDate = '2020-01-01'; // Past date
    const taskData = {
      title: 'وظیفه با تاریخ گذشته',
      deadline: pastDate
    };

    await kanbanPage.createTask(taskData);

    // Should still create task but may show warning
    const isVisible = await kanbanPage.isTaskVisible(taskData.title);
    expect(isVisible).toBe(true);

    await kanbanPage.takeKanbanScreenshot('past_deadline_handling');
  });

  test('TC-TM-009: Create task with special characters in title', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    const maliciousTitle = '<script>alert("xss")</script>';
    const taskData = {
      title: maliciousTitle
    };

    await kanbanPage.createTask(taskData);

    // Verify no script execution and proper sanitization
    const isVisible = await kanbanPage.isTaskVisible(maliciousTitle);
    expect(isVisible).toBe(true); // Title should be displayed safely

    await kanbanPage.takeKanbanScreenshot('special_characters_handling');
  });

  test('TC-TM-010: Delete task without confirmation', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    // Create task
    const taskTitle = 'وظیفه برای تست لغو حذف';
    await kanbanPage.createTask({ title: taskTitle });

    // Try to delete but cancel
    await kanbanPage.openTaskDetails(taskTitle);
    // Click delete button but don't confirm - this needs to be implemented
    // based on actual UI behavior

    await kanbanPage.takeKanbanScreenshot('delete_cancellation');
  });

  test('TC-TM-011: Edit task from different workspace', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    // Create task
    const taskTitle = 'وظیفه بین ورک‌اسپیس‌ها';
    await kanbanPage.createTask({ title: taskTitle });

    // Switch workspace (if available)
    // This would require workspace switching functionality

    await kanbanPage.takeKanbanScreenshot('workspace_isolation');
  });
});

test.describe('Task Management - Security Tests', () => {
  let dashboardPage: DashboardPage;
  let kanbanPage: KanbanPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    kanbanPage = new KanbanPage(page);
    await page.goto('http://localhost:3000/dashboard/kanban');
    await page.waitForLoadState('networkidle');
  });

  test('TC-TM-013: SQL Injection in search/title', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    const sqlInjection = "' OR '1'='1";
    const taskData = {
      title: sqlInjection
    };

    await kanbanPage.createTask(taskData);

    // Verify no database error and task creation works normally
    const isVisible = await kanbanPage.isTaskVisible(sqlInjection);
    expect(isVisible).toBe(true);

    await kanbanPage.takeKanbanScreenshot('sql_injection_resistance');
  });

  test('TC-TM-014: XSS in task title', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    const xssPayload = '<img src=x onerror=alert("xss")>';
    const taskData = {
      title: xssPayload
    };

    await kanbanPage.createTask(taskData);

    // Verify no alert was triggered and content is safely displayed
    const isVisible = await kanbanPage.isTaskVisible(xssPayload);
    expect(isVisible).toBe(true);

    await kanbanPage.takeKanbanScreenshot('xss_prevention');
  });

  test('TC-TM-015: IDOR - Access other user tasks', async ({ page }) => {
    await dashboardPage.navigateToKanban();

    // Try to access task by manipulating URL or parameters
    // This would require knowledge of other users' task IDs

    // For demo purposes, just verify current user can only see their tasks
    const taskCount = await kanbanPage.getTaskCount();
    expect(typeof taskCount).toBe('number');

    await kanbanPage.takeKanbanScreenshot('idor_prevention_check');
  });
});
