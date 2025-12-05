import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Environment safety check - prevent tests from running in production
const isProduction = process.env.NODE_ENV === 'production' ||
                    process.env.VERCEL_ENV === 'production' ||
                    process.env.RAILWAY_ENVIRONMENT === 'production';

if (isProduction) {
  console.error('🚫 Tests are disabled in production environment!');
  console.error('Tests should only run in development or testing environments.');
  process.exit(1);
}

// Only run tests in allowed environments
const allowedEnvs = ['development', 'test', 'dev', 'staging'];
const currentEnv = process.env.NODE_ENV || 'development';

if (!allowedEnvs.includes(currentEnv) && !isProduction) {
  console.warn(`⚠️  Running tests in ${currentEnv} environment. Make sure this is intentional.`);
}

interface PageInfo {
  url: string;
  title: string;
  elements: {
    buttons: string[];
    links: string[];
    inputs: string[];
    forms: string[];
    selects: string[];
    textareas: string[];
  };
  apiCalls: string[];
  screenshots: string[];
}

interface AppMap {
  pages: PageInfo[];
  features: string[];
  userRoles: string[];
  apiEndpoints: string[];
}

class AppCrawler {
  private visitedUrls = new Set<string>();
  private appMap: AppMap = {
    pages: [],
    features: [],
    userRoles: [],
    apiEndpoints: []
  };
  private baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  async crawlPage(page: Page, url: string): Promise<void> {
    if (this.visitedUrls.has(url)) return;
    this.visitedUrls.add(url);

    console.log(`Crawling: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000); // Wait for dynamic content

      const title = await page.title();
      console.log(`Page title: ${title}`);

      // Take screenshot
      const screenshotPath = `tests/screenshots/${url.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Collect elements
      const buttons = await page.locator('button, [role="button"], input[type="submit"], input[type="button"]').allTextContents();
      const links = await page.locator('a').all();
      const linkData = await Promise.all(links.map(async (link) => ({
        text: await link.textContent() || '',
        href: await link.getAttribute('href') || ''
      })));

      const inputs = await page.locator('input:not([type="hidden"])').all();
      const inputData = await Promise.all(inputs.map(async (input) => ({
        type: await input.getAttribute('type') || 'text',
        name: await input.getAttribute('name') || '',
        placeholder: await input.getAttribute('placeholder') || ''
      })));

      const forms = await page.locator('form').all();
      const formData = await Promise.all(forms.map(async (form, index) => ({
        action: await form.getAttribute('action') || '',
        method: await form.getAttribute('method') || 'GET',
        inputs: await form.locator('input, select, textarea').count()
      })));

      const selects = await page.locator('select').allTextContents();
      const textareas = await page.locator('textarea').allTextContents();

      // Monitor API calls
      const apiCalls: string[] = [];
      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('supabase')) {
          apiCalls.push(`${request.method()} ${url}`);
        }
      });

      // Try to interact with elements to discover functionality
      await this.interactWithElements(page);

      // Collect navigation links for further crawling
      const navLinks = linkData
        .filter(link => link.href && (link.href.startsWith('/') || link.href.startsWith(this.baseUrl)))
        .map(link => link.href!.startsWith('/') ? `${this.baseUrl}${link.href}` : link.href!)
        .filter(href => href && !href.includes('#') && !href.includes('mailto:') && !href.includes('tel:'));

      const pageInfo: PageInfo = {
        url,
        title,
        elements: {
          buttons: buttons.filter(b => b.trim()),
          links: linkData.map(l => l.text?.trim()).filter((t): t is string => Boolean(t)),
          inputs: inputData.map(i => `${i.type} ${i.name} ${i.placeholder}`).filter(i => i.trim()),
          forms: formData.map((f, index) => `Form ${index + 1}: ${f.method} ${f.action} (${f.inputs} inputs)`),
          selects: selects.filter(s => s.trim()),
          textareas: textareas.filter(t => t.trim())
        },
        apiCalls: [...new Set(apiCalls)],
        screenshots: [screenshotPath]
      };

      this.appMap.pages.push(pageInfo);

      // Recursively crawl linked pages (limit depth to avoid infinite loops)
      if (this.visitedUrls.size < 20) { // Limit to 20 pages
        for (const link of navLinks.slice(0, 5)) { // Limit links per page
          if (!this.visitedUrls.has(link)) {
            await this.crawlPage(page, link);
          }
        }
      }

    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  async interactWithElements(page: Page): Promise<void> {
    try {
      // Try to click buttons that might reveal functionality
      const clickableButtons = page.locator('button:not([disabled]), [role="button"]:not([aria-disabled="true"])');
      const buttonCount = await clickableButtons.count();

      for (let i = 0; i < Math.min(buttonCount, 3); i++) { // Limit interactions
        try {
          await clickableButtons.nth(i).click();
          await page.waitForTimeout(1000);
          // Take screenshot after interaction
          const screenshotPath = `tests/screenshots/interaction_${Date.now()}_${i}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          // Close any modals or go back
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        } catch (e) {
          // Ignore interaction errors
        }
      }

      // Try to fill and submit forms
      const forms = page.locator('form');
      const formCount = await forms.count();

      for (let i = 0; i < Math.min(formCount, 2); i++) {
        try {
          const form = forms.nth(i);
          const inputs = form.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');

          // Fill form inputs with test data
          await inputs.nth(0).fill('Test Data');
          if (await inputs.count() > 1) {
            await inputs.nth(1).fill('test@example.com');
          }

          // Try to submit
          await form.locator('input[type="submit"], button[type="submit"], button').first().click();
          await page.waitForTimeout(2000);

          // Take screenshot
          const screenshotPath = `tests/screenshots/form_submit_${Date.now()}_${i}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
        } catch (e) {
          // Ignore form submission errors
        }
      }

    } catch (error) {
      console.error('Error interacting with elements:', error);
    }
  }

  async analyzeFeatures(): Promise<void> {
    const features = new Set<string>();

    for (const page of this.appMap.pages) {
      // Analyze based on page content and elements
      if (page.url.includes('/kanban')) features.add('Kanban Board Management');
      if (page.url.includes('/calendar')) features.add('Calendar View');
      if (page.url.includes('/analytics')) features.add('Analytics & Reporting');
      if (page.url.includes('/search')) features.add('Advanced Search');
      if (page.url.includes('/templates')) features.add('Task Templates');
      if (page.url.includes('/settings')) features.add('User Settings');

      // Analyze buttons and links for features
      page.elements.buttons.forEach(button => {
        if (button.includes('ایجاد') || button.includes('افزودن')) features.add('Task Creation');
        if (button.includes('ویرایش')) features.add('Task Editing');
        if (button.includes('حذف')) features.add('Task Deletion');
        if (button.includes('اشتراک')) features.add('Task Sharing');
      });

      // Analyze API calls for backend features
      page.apiCalls.forEach(call => {
        if (call.includes('/api/tasks')) features.add('Task CRUD Operations');
        if (call.includes('/api/workspaces')) features.add('Workspace Management');
        if (call.includes('/api/labels')) features.add('Label Management');
        if (call.includes('/api/subtasks')) features.add('Subtask Management');
        if (call.includes('/api/telegram')) features.add('Telegram Integration');
        if (call.includes('/api/notifications')) features.add('Notification System');
      });
    }

    this.appMap.features = Array.from(features);
  }

  async analyzeUserRoles(): Promise<void> {
    // Based on common patterns in enterprise apps
    this.appMap.userRoles = [
      'Guest User',
      'Regular User',
      'Workspace Admin',
      'Super Admin',
      'API Service Account'
    ];
  }

  async analyzeAPIs(): Promise<void> {
    const apis = new Set<string>();

    for (const page of this.appMap.pages) {
      page.apiCalls.forEach(call => {
        const url = call.split(' ')[1];
        if (url) apis.add(url);
      });
    }

    this.appMap.apiEndpoints = Array.from(apis);
  }

  async generateReport(): Promise<void> {
    const report = {
      crawlTimestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        pagesCrawled: this.appMap.pages.length,
        featuresDiscovered: this.appMap.features.length,
        apiEndpoints: this.appMap.apiEndpoints.length,
        userRoles: this.appMap.userRoles.length
      },
      appMap: this.appMap
    };

    // Ensure screenshots directory exists
    if (!fs.existsSync('tests/screenshots')) {
      fs.mkdirSync('tests/screenshots', { recursive: true });
    }

    fs.writeFileSync('tests/crawl-report.json', JSON.stringify(report, null, 2));
    console.log('Crawl report saved to tests/crawl-report.json');
  }

  async crawl(page: Page): Promise<AppMap> {
    await this.crawlPage(page, this.baseUrl);
    await this.analyzeFeatures();
    await this.analyzeUserRoles();
    await this.analyzeAPIs();
    await this.generateReport();

    return this.appMap;
  }
}

test.describe('Application Crawler', () => {
  test('Smart Crawl and Feature Discovery', async ({ page }) => {
    const crawler = new AppCrawler();
    const appMap = await crawler.crawl(page);

    // Basic assertions
    expect(appMap.pages.length).toBeGreaterThan(0);
    expect(appMap.features.length).toBeGreaterThan(0);

    // Save results for further analysis
    console.log('Crawled pages:', appMap.pages.length);
    console.log('Discovered features:', appMap.features);
    console.log('API endpoints:', appMap.apiEndpoints);
  });
});
