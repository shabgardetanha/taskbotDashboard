import { BasePage } from './BasePage';
import type { Page, Locator } from '@playwright/test';

export class DashboardPage extends BasePage {
  // Navigation elements
  private readonly kanbanLink: Locator;
  private readonly calendarLink: Locator;
  private readonly analyticsLink: Locator;
  private readonly searchLink: Locator;
  private readonly templatesLink: Locator;
  private readonly settingsLink: Locator;

  // Common elements
  private readonly createTaskButton: Locator;
  private readonly workspaceSelector: Locator;
  private readonly notificationsButton: Locator;
  private readonly userMenu: Locator;
  private readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation
    this.kanbanLink = page.getByRole('link', { name: 'کانبان' });
    this.calendarLink = page.getByRole('link', { name: 'تقویم' });
    this.analyticsLink = page.getByRole('link', { name: 'تحلیل‌ها' });
    this.searchLink = page.getByRole('link', { name: 'جستجو' });
    this.templatesLink = page.getByRole('link', { name: 'قالب‌ها' });
    this.settingsLink = page.getByRole('link', { name: 'تنظیمات' });

    // Common elements
    this.createTaskButton = page.getByRole('button', { name: 'وظیفه جدید' });
    this.workspaceSelector = page.locator('[data-testid="workspace-selector"]');
    this.notificationsButton = page.locator('[data-testid="notifications-button"]');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.getByRole('button', { name: 'خروج' });
  }

  async navigateToKanban(): Promise<void> {
    await this.kanbanLink.click();
    await this.waitForLoad();
  }

  async navigateToCalendar(): Promise<void> {
    await this.calendarLink.click();
    await this.waitForLoad();
  }

  async navigateToAnalytics(): Promise<void> {
    await this.analyticsLink.click();
    await this.waitForLoad();
  }

  async navigateToSearch(): Promise<void> {
    await this.searchLink.click();
    await this.waitForLoad();
  }

  async navigateToTemplates(): Promise<void> {
    await this.templatesLink.click();
    await this.waitForLoad();
  }

  async navigateToSettings(): Promise<void> {
    await this.settingsLink.click();
    await this.waitForLoad();
  }

  async clickCreateTask(): Promise<void> {
    await this.createTaskButton.click();
  }

  async selectWorkspace(name: string): Promise<void> {
    await this.workspaceSelector.click();
    await this.page.getByText(name).click();
  }

  async openNotifications(): Promise<void> {
    await this.notificationsButton.click();
  }

  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.userMenu.isVisible();
  }

  async getCurrentWorkspace(): Promise<string> {
    return await this.workspaceSelector.textContent() || '';
  }

  async takeDashboardScreenshot(name: string): Promise<void> {
    await this.takeScreenshot(`dashboard_${name}`);
  }
}
