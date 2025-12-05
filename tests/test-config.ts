// tests/test-config.ts - Test configuration and shared utilities
export const TestConfig = {
  // Base URLs
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  stagingUrl: process.env.STAGING_URL || 'https://staging.taskbot.example.com',

  // Test timeouts
  timeouts: {
    action: 5000,
    navigation: 30000,
    expectation: 10000
  },

  // Test data
  testData: {
    workspaces: {
      default: 'Test Workspace',
      secondary: 'Secondary Workspace'
    },
    users: {
      admin: { email: 'admin@test.com', password: 'admin123' },
      user: { email: 'user@test.com', password: 'user123' }
    }
  },

  // Selectors and data attributes
  selectors: {
    // Common
    loadingSpinner: '[data-testid="loading-spinner"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',

    // Navigation
    sidebar: '[data-testid="sidebar"]',
    kanbanLink: '[data-testid="nav-kanban"]',
    calendarLink: '[data-testid="nav-calendar"]',
    analyticsLink: '[data-testid="nav-analytics"]',

    // Kanban board
    kanbanBoard: '[data-testid="kanban-board"]',
    column: (status: string) => `[data-testid="column-${status}"]`,
    taskCard: '[data-testid="task-card"]',
    taskCardById: (id: string) => `[data-testid="task-${id}"]`,

    // Task modal
    createTaskModal: '[data-testid="create-task-modal"]',
    editTaskModal: '[data-testid="edit-task-modal"]',
    taskDetailModal: '[data-testid="task-detail-modal"]',

    // Forms
    formField: (name: string) => `[data-testid="field-${name}"]`,
    formSubmit: '[data-testid="form-submit"]',
    formCancel: '[data-testid="form-cancel"]',

    // Buttons
    createButton: '[data-testid="create-button"]',
    editButton: '[data-testid="edit-button"]',
    deleteButton: '[data-testid="delete-button"]',
    saveButton: '[data-testid="save-button"]',
    cancelButton: '[data-testid="cancel-button"]',

    // Filters and search
    searchInput: '[data-testid="search-input"]',
    filterButton: '[data-testid="filter-button"]',
    sortButton: '[data-testid="sort-button"]',

    // Stats
    totalTasks: '[data-testid="total-tasks"]',
    tasksByStatus: (status: string) => `[data-testid="tasks-${status}"]`
  },

  // Test utilities
  utils: {
    // Generate unique test identifiers
    generateId: (prefix = 'test') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

    // Generate test task data
    createTaskData: (overrides = {}) => ({
      title: `Test Task ${TestConfig.utils.generateId()}`,
      description: 'Test task description',
      priority: 'medium',
      status: 'todo',
      labels: ['test'],
      assignee: null,
      dueDate: null,
      ...overrides
    }),

    // Generate test user data
    createUserData: (overrides = {}) => ({
      email: `test${TestConfig.utils.generateId()}@example.com`,
      password: 'test123456',
      fullName: `Test User ${TestConfig.utils.generateId()}`,
      ...overrides
    }),

    // Wait utilities
    waitForStableDOM: async (page: any, timeout = 2000) => {
      await page.waitForTimeout(timeout)
    },

    // Screenshot utilities
    takeScreenshot: async (page: any, name: string) => {
      await page.screenshot({
        path: `tests/screenshots/${name}-${Date.now()}.png`,
        fullPage: true
      })
    },

    // Local storage utilities
    setLocalStorage: async (page: any, key: string, value: any) => {
      await page.evaluate(({ key, value }: { key: string; value: any }) => {
        localStorage.setItem(key, JSON.stringify(value))
      }, { key, value })
    },

    getLocalStorage: async (page: any, key: string) => {
      return await page.evaluate((key: string) => {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      }, key)
    }
  }
}

export default TestConfig
