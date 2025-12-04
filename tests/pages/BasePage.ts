import type { Page } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async fill(selector: string, text: string): Promise<void> {
    await this.page.fill(selector, text);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.selectOption(selector, value);
  }

  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async waitForSelector(selector: string, timeout = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  async getByRole(role: string, options?: { name?: string }): Promise<any> {
    return this.page.getByRole(role as any, options);
  }

  async getByText(text: string): Promise<any> {
    return this.page.getByText(text);
  }

  async getByPlaceholder(placeholder: string): Promise<any> {
    return this.page.getByPlaceholder(placeholder);
  }

  async getByLabel(label: string): Promise<any> {
    return this.page.getByLabel(label);
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async uploadFile(selector: string, filePath: string): Promise<void> {
    await this.page.setInputFiles(selector, filePath);
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
  }

  async expectText(selector: string, expectedText: string): Promise<void> {
    const actualText = await this.getText(selector);
    if (!actualText.includes(expectedText)) {
      throw new Error(`Expected text "${expectedText}" not found in "${actualText}"`);
    }
  }

  async expectVisible(selector: string): Promise<void> {
    const isVisible = await this.isVisible(selector);
    if (!isVisible) {
      throw new Error(`Element ${selector} is not visible`);
    }
  }

  async expectNotVisible(selector: string): Promise<void> {
    const isVisible = await this.isVisible(selector);
    if (isVisible) {
      throw new Error(`Element ${selector} should not be visible`);
    }
  }
}
