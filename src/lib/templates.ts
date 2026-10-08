import {
  createDatabase,
  createProperty,
  createView,
  updateView,
  createRecord,
  createOption,
  upsertValue,
  type PropertyType,
  type ViewType,
} from './database';
import { supabase, type Block } from './supabase';

export interface TemplateProperty {
  name: string;
  type: PropertyType;
  isPrimary?: boolean;
  config?: Record<string, unknown>;
  options?: { label: string; color: string }[];
}

export interface TemplateView {
  name: string;
  type: ViewType;
  isDefault?: boolean;
  groupByProperty?: string;
}

export interface TemplateRecord {
  values: Record<string, string | number | boolean | string[] | null>;
}

export interface TemplateDatabase {
  name: string;
  icon: string;
  pageIcon: string;
  pageTitle: string;
  pageDescription?: string;
  properties: TemplateProperty[];
  views: TemplateView[];
  records: TemplateRecord[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'productivity' | 'personal' | 'business' | 'education' | 'lifestyle';
  color: string;
  databases: TemplateDatabase[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'student-planner',
    name: 'Student Planner',
    description: 'Track assignments, courses, and deadlines',
    icon: '🎓',
    category: 'education',
    color: 'blue',
    databases: [
      {
        name: 'Assignments',
        icon: '📝',
        pageIcon: '🎓',
        pageTitle: 'Student Planner',
        pageDescription: 'Track assignments, courses, and deadlines',
        properties: [
          { name: 'Assignment', type: 'text', isPrimary: true },
          { name: 'Course', type: 'select', options: [
            { label: 'Math', color: 'blue' },
            { label: 'Science', color: 'green' },
            { label: 'History', color: 'orange' },
            { label: 'English', color: 'purple' },
          ]},
          { name: 'Status', type: 'status', options: [
            { label: 'Not Started', color: 'gray' },
            { label: 'In Progress', color: 'yellow' },
            { label: 'Submitted', color: 'blue' },
            { label: 'Graded', color: 'green' },
          ]},
          { name: 'Due Date', type: 'date' },
          { name: 'Priority', type: 'select', options: [
            { label: 'High', color: 'red' },
            { label: 'Medium', color: 'orange' },
            { label: 'Low', color: 'gray' },
          ]},
          { name: 'Grade', type: 'percent' },
          { name: 'Notes', type: 'long_text' },
        ],
        views: [
          { name: 'All Assignments', type: 'table', isDefault: true },
          { name: 'By Status', type: 'board', groupByProperty: 'Status' },
          { name: 'By Course', type: 'board', groupByProperty: 'Course' },
          { name: 'Calendar', type: 'calendar' },
        ],
        records: [
          { values: { Assignment: 'Problem Set 5', Course: 'Math', Status: 'In Progress', 'Due Date': new Date(Date.now() + 3 * 86400000).toISOString(), Priority: 'High' } },
          { values: { Assignment: 'Lab Report', Course: 'Science', Status: 'Not Started', 'Due Date': new Date(Date.now() + 7 * 86400000).toISOString(), Priority: 'Medium' } },
          { values: { Assignment: 'Essay Draft', Course: 'English', Status: 'Submitted', Priority: 'Medium' } },
        ],
      },
    ],
  },
  {
    id: 'personal-journal',
    name: 'Personal Journal',
    description: 'Daily entries with mood tracking',
    icon: '📔',
    category: 'personal',
    color: 'pink',
    databases: [
      {
        name: 'Journal Entries',
        icon: '📔',
        pageIcon: '📔',
        pageTitle: 'My Journal',
        pageDescription: 'Daily reflections and mood tracking',
        properties: [
          { name: 'Title', type: 'text', isPrimary: true },
          { name: 'Date', type: 'date' },
          { name: 'Mood', type: 'select', options: [
            { label: 'Great', color: 'green' },
            { label: 'Good', color: 'teal' },
            { label: 'Okay', color: 'yellow' },
            { label: 'Low', color: 'orange' },
            { label: 'Tough', color: 'red' },
          ]},
          { name: 'Entry', type: 'long_text' },
          { name: 'Gratitude', type: 'long_text' },
          { name: 'Tags', type: 'tags', options: [
            { label: 'work', color: 'blue' },
            { label: 'family', color: 'pink' },
            { label: 'health', color: 'green' },
            { label: 'travel', color: 'teal' },
          ]},
        ],
        views: [
          { name: 'All Entries', type: 'list', isDefault: true },
          { name: 'Gallery', type: 'gallery' },
          { name: 'Calendar', type: 'calendar' },
        ],
        records: [
          { values: { Title: 'Morning Reflections', Date: new Date().toISOString(), Mood: 'Good', Entry: 'Started the day with a quiet walk and a good cup of coffee.', Gratitude: 'Grateful for the calm morning.' } },
        ],
      },
    ],
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Build streaks and track daily habits',
    icon: '✅',
    category: 'personal',
    color: 'green',
    databases: [
      {
        name: 'Habits',
        icon: '✅',
        pageIcon: '✅',
        pageTitle: 'Habit Tracker',
        pageDescription: 'Build streaks and track daily habits',
        properties: [
          { name: 'Habit', type: 'text', isPrimary: true },
          { name: 'Category', type: 'select', options: [
            { label: 'Health', color: 'green' },
            { label: 'Learning', color: 'blue' },
            { label: 'Mindfulness', color: 'purple' },
            { label: 'Productivity', color: 'orange' },
          ]},
          { name: 'Frequency', type: 'select', options: [
            { label: 'Daily', color: 'blue' },
            { label: 'Weekly', color: 'teal' },
            { label: '3x/week', color: 'yellow' },
          ]},
          { name: 'Done Today', type: 'checkbox' },
          { name: 'Streak', type: 'number', config: { decimals: 0 } },
          { name: 'Target Streak', type: 'number', config: { decimals: 0 } },
          { name: 'Progress', type: 'progress' },
        ],
        views: [
          { name: 'All Habits', type: 'table', isDefault: true },
          { name: 'By Category', type: 'board', groupByProperty: 'Category' },
          { name: 'Gallery', type: 'gallery' },
        ],
        records: [
          { values: { Habit: 'Drink 8 glasses of water', Category: 'Health', Frequency: 'Daily', 'Done Today': true, Streak: 12, 'Target Streak': 30, Progress: 40 } },
          { values: { Habit: 'Read 20 minutes', Category: 'Learning', Frequency: 'Daily', 'Done Today': false, Streak: 5, 'Target Streak': 30, Progress: 17 } },
          { values: { Habit: 'Meditate', Category: 'Mindfulness', Frequency: 'Daily', 'Done Today': true, Streak: 21, 'Target Streak': 21, Progress: 100 } },
        ],
      },
    ],
  },
  {
    id: 'finance-tracker',
    name: 'Finance Tracker',
    description: 'Monitor income, expenses, and budgets',
    icon: '💰',
    category: 'business',
    color: 'teal',
    databases: [
      {
        name: 'Transactions',
        icon: '💰',
        pageIcon: '💰',
        pageTitle: 'Finance Tracker',
        pageDescription: 'Monitor income, expenses, and budgets',
        properties: [
          { name: 'Description', type: 'text', isPrimary: true },
          { name: 'Type', type: 'status', options: [
            { label: 'Income', color: 'green' },
            { label: 'Expense', color: 'red' },
            { label: 'Transfer', color: 'gray' },
          ]},
          { name: 'Category', type: 'select', options: [
            { label: 'Salary', color: 'green' },
            { label: 'Groceries', color: 'blue' },
            { label: 'Rent', color: 'orange' },
            { label: 'Utilities', color: 'yellow' },
            { label: 'Entertainment', color: 'purple' },
            { label: 'Transport', color: 'teal' },
            { label: 'Other', color: 'gray' },
          ]},
          { name: 'Amount', type: 'currency', config: { symbol: '$', decimals: 2 } },
          { name: 'Date', type: 'date' },
          { name: 'Account', type: 'select', options: [
            { label: 'Checking', color: 'blue' },
            { label: 'Savings', color: 'green' },
            { label: 'Credit Card', color: 'red' },
          ]},
          { name: 'Notes', type: 'long_text' },
        ],
        views: [
          { name: 'All Transactions', type: 'table', isDefault: true },
          { name: 'By Category', type: 'board', groupByProperty: 'Category' },
          { name: 'By Type', type: 'board', groupByProperty: 'Type' },
          { name: 'Calendar', type: 'calendar' },
        ],
        records: [
          { values: { Description: 'Monthly Salary', Type: 'Income', Category: 'Salary', Amount: 4500, Date: new Date().toISOString(), Account: 'Checking' } },
          { values: { Description: 'Grocery Run', Type: 'Expense', Category: 'Groceries', Amount: 87.5, Date: new Date().toISOString(), Account: 'Credit Card' } },
          { values: { Description: 'Electric Bill', Type: 'Expense', Category: 'Utilities', Amount: 120, Date: new Date().toISOString(), Account: 'Checking' } },
        ],
      },
    ],
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Manage contacts, deals, and pipeline',
    icon: '🤝',
    category: 'business',
    color: 'blue',
    databases: [
      {
        name: 'Contacts',
        icon: '👤',
        pageIcon: '🤝',
        pageTitle: 'CRM',
        pageDescription: 'Manage contacts, deals, and pipeline',
        properties: [
          { name: 'Name', type: 'text', isPrimary: true },
          { name: 'Company', type: 'text' },
          { name: 'Email', type: 'email' },
          { name: 'Phone', type: 'phone' },
          { name: 'Stage', type: 'status', options: [
            { label: 'Lead', color: 'gray' },
            { label: 'Qualified', color: 'blue' },
            { label: 'Proposal', color: 'yellow' },
            { label: 'Negotiation', color: 'orange' },
            { label: 'Won', color: 'green' },
            { label: 'Lost', color: 'red' },
          ]},
          { name: 'Value', type: 'currency', config: { symbol: '$', decimals: 0 } },
          { name: 'Next Step', type: 'text' },
          { name: 'Last Contact', type: 'date' },
          { name: 'Tags', type: 'tags', options: [
            { label: 'hot', color: 'red' },
            { label: 'warm', color: 'orange' },
            { label: 'cold', color: 'blue' },
            { label: 'priority', color: 'purple' },
          ]},
        ],
        views: [
          { name: 'Pipeline', type: 'board', isDefault: true, groupByProperty: 'Stage' },
          { name: 'All Contacts', type: 'table' },
          { name: 'Gallery', type: 'gallery' },
        ],
        records: [
          { values: { Name: 'Sarah Chen', Company: 'TechFlow Inc', Email: 'sarah@techflow.com', Phone: '+1-555-0101', Stage: 'Proposal', Value: 25000, 'Next Step': 'Send contract', Tags: ['hot'] } },
          { values: { Name: 'Marcus Webb', Company: 'CloudPeak', Email: 'marcus@cloudpeak.io', Stage: 'Qualified', Value: 15000, 'Next Step': 'Demo call', Tags: ['warm'] } },
          { values: { Name: 'Emily Rodriguez', Company: 'DataSync', Email: 'emily@datasync.com', Stage: 'Lead', Value: 8000, 'Next Step': 'Intro meeting' } },
        ],
      },
    ],
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Tasks, milestones, and team collaboration',
    icon: '🚀',
    category: 'productivity',
    color: 'orange',
    databases: [
      {
        name: 'Tasks',
        icon: '📋',
        pageIcon: '🚀',
        pageTitle: 'Project Hub',
        pageDescription: 'Tasks, milestones, and team collaboration',
        properties: [
          { name: 'Task', type: 'text', isPrimary: true },
          { name: 'Status', type: 'status', options: [
            { label: 'Backlog', color: 'gray' },
            { label: 'To Do', color: 'blue' },
            { label: 'In Progress', color: 'yellow' },
            { label: 'Review', color: 'orange' },
            { label: 'Done', color: 'green' },
          ]},
          { name: 'Priority', type: 'select', options: [
            { label: 'Urgent', color: 'red' },
            { label: 'High', color: 'orange' },
            { label: 'Medium', color: 'yellow' },
            { label: 'Low', color: 'gray' },
          ]},
          { name: 'Assignee', type: 'person' },
          { name: 'Due Date', type: 'date' },
          { name: 'Progress', type: 'progress' },
          { name: 'Tags', type: 'tags', options: [
            { label: 'frontend', color: 'blue' },
            { label: 'backend', color: 'green' },
            { label: 'design', color: 'purple' },
            { label: 'bug', color: 'red' },
            { label: 'feature', color: 'teal' },
          ]},
        ],
        views: [
          { name: 'Board', type: 'board', isDefault: true, groupByProperty: 'Status' },
          { name: 'All Tasks', type: 'table' },
          { name: 'By Priority', type: 'board', groupByProperty: 'Priority' },
          { name: 'Calendar', type: 'calendar' },
        ],
        records: [
          { values: { Task: 'Design landing page', Status: 'In Progress', Priority: 'High', 'Due Date': new Date(Date.now() + 5 * 86400000).toISOString(), Progress: 60, Tags: ['design'] } },
          { values: { Task: 'Set up CI/CD', Status: 'To Do', Priority: 'Medium', 'Due Date': new Date(Date.now() + 10 * 86400000).toISOString(), Progress: 0, Tags: ['backend'] } },
          { values: { Task: 'Fix auth bug', Status: 'Done', Priority: 'Urgent', Progress: 100, Tags: ['bug', 'backend'] } },
          { values: { Task: 'User research interviews', Status: 'Backlog', Priority: 'Low', Tags: ['feature'] } },
        ],
      },
    ],
  },
  {
    id: 'trading-journal',
    name: 'Trading Journal',
    description: 'Log trades and analyze performance',
    icon: '📈',
    category: 'business',
    color: 'green',
    databases: [
      {
        name: 'Trades',
        icon: '📈',
        pageIcon: '📈',
        pageTitle: 'Trading Journal',
        pageDescription: 'Log trades and analyze performance',
        properties: [
          { name: 'Symbol', type: 'text', isPrimary: true },
          { name: 'Direction', type: 'status', options: [
            { label: 'Long', color: 'green' },
            { label: 'Short', color: 'red' },
          ]},
          { name: 'Entry Price', type: 'currency', config: { symbol: '$', decimals: 2 } },
          { name: 'Exit Price', type: 'currency', config: { symbol: '$', decimals: 2 } },
          { name: 'Quantity', type: 'number', config: { decimals: 0 } },
          { name: 'P&L', type: 'currency', config: { symbol: '$', decimals: 2 } },
          { name: 'Status', type: 'status', options: [
            { label: 'Open', color: 'blue' },
            { label: 'Closed', color: 'gray' },
          ]},
          { name: 'Date', type: 'date' },
          { name: 'Strategy', type: 'select', options: [
            { label: 'Breakout', color: 'blue' },
            { label: 'Reversal', color: 'purple' },
            { label: 'Trend Follow', color: 'green' },
            { label: 'Scalp', color: 'orange' },
          ]},
          { name: 'Notes', type: 'long_text' },
          { name: 'Rating', type: 'rating', config: { max: 5 } },
        ],
        views: [
          { name: 'All Trades', type: 'table', isDefault: true },
          { name: 'By Strategy', type: 'board', groupByProperty: 'Strategy' },
          { name: 'By Status', type: 'board', groupByProperty: 'Status' },
          { name: 'Calendar', type: 'calendar' },
        ],
        records: [
          { values: { Symbol: 'AAPL', Direction: 'Long', 'Entry Price': 175.5, 'Exit Price': 182.0, Quantity: 100, 'P&L': 650, Status: 'Closed', Date: new Date(Date.now() - 2 * 86400000).toISOString(), Strategy: 'Breakout', Rating: 4 } },
          { values: { Symbol: 'TSLA', Direction: 'Short', 'Entry Price': 250.0, Quantity: 50, Status: 'Open', Date: new Date().toISOString(), Strategy: 'Reversal', Rating: 3 } },
        ],
      },
    ],
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    description: 'Organize articles, notes, and resources',
    icon: '📚',
    category: 'productivity',
    color: 'purple',
    databases: [
      {
        name: 'Articles',
        icon: '📚',
        pageIcon: '📚',
        pageTitle: 'Knowledge Base',
        pageDescription: 'Organize articles, notes, and resources',
        properties: [
          { name: 'Title', type: 'text', isPrimary: true },
          { name: 'Category', type: 'select', options: [
            { label: 'Engineering', color: 'blue' },
            { label: 'Design', color: 'purple' },
            { label: 'Product', color: 'green' },
            { label: 'Operations', color: 'orange' },
            { label: 'Marketing', color: 'pink' },
          ]},
          { name: 'Status', type: 'status', options: [
            { label: 'Draft', color: 'gray' },
            { label: 'In Review', color: 'yellow' },
            { label: 'Published', color: 'green' },
            { label: 'Archived', color: 'red' },
          ]},
          { name: 'Author', type: 'person' },
          { name: 'Tags', type: 'tags', options: [
            { label: 'guide', color: 'blue' },
            { label: 'reference', color: 'teal' },
            { label: 'how-to', color: 'green' },
            { label: 'policy', color: 'orange' },
          ]},
          { name: 'Summary', type: 'long_text' },
          { name: 'URL', type: 'url' },
          { name: 'Last Updated', type: 'date' },
        ],
        views: [
          { name: 'All Articles', type: 'table', isDefault: true },
          { name: 'By Category', type: 'board', groupByProperty: 'Category' },
          { name: 'Gallery', type: 'gallery' },
        ],
        records: [
          { values: { Title: 'Code Review Guidelines', Category: 'Engineering', Status: 'Published', Tags: ['guide', 'reference'], Summary: 'Best practices for reviewing pull requests.', 'Last Updated': new Date().toISOString() } },
          { values: { Title: 'Brand Style Guide', Category: 'Design', Status: 'Published', Tags: ['reference'] } },
          { values: { Title: 'Onboarding Checklist', Category: 'Operations', Status: 'In Review', Tags: ['how-to'] } },
        ],
      },
    ],
  },
  {
    id: 'goal-tracker',
    name: 'Goal Tracker',
    description: 'Set goals, track milestones, and stay motivated',
    icon: '🎯',
    category: 'personal',
    color: 'orange',
    databases: [
      {
        name: 'Goals',
        icon: '🎯',
        pageIcon: '🎯',
        pageTitle: 'Goal Tracker',
        pageDescription: 'Set goals, track milestones, and stay motivated',
        properties: [
          { name: 'Goal', type: 'text', isPrimary: true },
          { name: 'Category', type: 'select', options: [
            { label: 'Career', color: 'blue' },
            { label: 'Health', color: 'green' },
            { label: 'Finance', color: 'teal' },
            { label: 'Personal', color: 'purple' },
            { label: 'Learning', color: 'orange' },
          ]},
          { name: 'Status', type: 'status', options: [
            { label: 'Not Started', color: 'gray' },
            { label: 'On Track', color: 'blue' },
            { label: 'At Risk', color: 'orange' },
            { label: 'Behind', color: 'red' },
            { label: 'Achieved', color: 'green' },
          ]},
          { name: 'Progress', type: 'progress' },
          { name: 'Target Date', type: 'date' },
          { name: 'Priority', type: 'rating', config: { max: 3 } },
          { name: 'Notes', type: 'long_text' },
        ],
        views: [
          { name: 'All Goals', type: 'table', isDefault: true },
          { name: 'By Category', type: 'board', groupByProperty: 'Category' },
          { name: 'By Status', type: 'board', groupByProperty: 'Status' },
        ],
        records: [
          { values: { Goal: 'Run a half marathon', Category: 'Health', Status: 'On Track', Progress: 55, 'Target Date': new Date(Date.now() + 60 * 86400000).toISOString(), Priority: 3 } },
          { values: { Goal: 'Save $10,000', Category: 'Finance', Status: 'On Track', Progress: 40, 'Target Date': new Date(Date.now() + 180 * 86400000).toISOString(), Priority: 2 } },
          { values: { Goal: 'Learn TypeScript', Category: 'Learning', Status: 'Achieved', Progress: 100, Priority: 2 } },
        ],
      },
    ],
  },
  {
    id: 'recipe-collection',
    name: 'Recipe Collection',
    description: 'Save and organize your favorite recipes',
    icon: '🍳',
    category: 'lifestyle',
    color: 'orange',
    databases: [
      {
        name: 'Recipes',
        icon: '🍳',
        pageIcon: '🍳',
        pageTitle: 'Recipe Collection',
        pageDescription: 'Save and organize your favorite recipes',
        properties: [
          { name: 'Recipe', type: 'text', isPrimary: true },
          { name: 'Cuisine', type: 'select', options: [
            { label: 'Italian', color: 'red' },
            { label: 'Asian', color: 'orange' },
            { label: 'Mexican', color: 'yellow' },
            { label: 'American', color: 'blue' },
            { label: 'Mediterranean', color: 'green' },
            { label: 'Dessert', color: 'pink' },
          ]},
          { name: 'Difficulty', type: 'select', options: [
            { label: 'Easy', color: 'green' },
            { label: 'Medium', color: 'yellow' },
            { label: 'Hard', color: 'red' },
          ]},
          { name: 'Prep Time (min)', type: 'number', config: { decimals: 0 } },
          { name: 'Servings', type: 'number', config: { decimals: 0 } },
          { name: 'Rating', type: 'rating', config: { max: 5 } },
          { name: 'Ingredients', type: 'long_text' },
          { name: 'Instructions', type: 'long_text' },
          { name: 'Tags', type: 'tags', options: [
            { label: 'vegetarian', color: 'green' },
            { label: 'vegan', color: 'teal' },
            { label: 'quick', color: 'blue' },
            { label: 'comfort', color: 'orange' },
          ]},
        ],
        views: [
          { name: 'All Recipes', type: 'gallery', isDefault: true },
          { name: 'By Cuisine', type: 'board', groupByProperty: 'Cuisine' },
          { name: 'Table', type: 'table' },
        ],
        records: [
          { values: { Recipe: 'Spaghetti Carbonara', Cuisine: 'Italian', Difficulty: 'Medium', 'Prep Time (min)': 20, Servings: 4, Rating: 5, Ingredients: '200g spaghetti, 2 eggs, 50g pecorino, 100g pancetta', Instructions: 'Boil pasta. Fry pancetta. Mix eggs and cheese. Combine.' } },
          { values: { Recipe: 'Chicken Tikka Masala', Cuisine: 'Asian', Difficulty: 'Medium', 'Prep Time (min)': 45, Servings: 4, Rating: 5 } },
          { values: { Recipe: 'Chocolate Chip Cookies', Cuisine: 'Dessert', Difficulty: 'Easy', 'Prep Time (min)': 15, Servings: 24, Rating: 5, Tags: ['comfort'] } },
        ],
      },
    ],
  },
  {
    id: 'book-library',
    name: 'Book Library',
    description: 'Track books you have read, are reading, or want to read',
    icon: '📖',
    category: 'lifestyle',
    color: 'blue',
    databases: [
      {
        name: 'Books',
        icon: '📖',
        pageIcon: '📖',
        pageTitle: 'Book Library',
        pageDescription: 'Track your reading list',
        properties: [
          { name: 'Title', type: 'text', isPrimary: true },
          { name: 'Author', type: 'text' },
          { name: 'Status', type: 'status', options: [
            { label: 'Want to Read', color: 'gray' },
            { label: 'Reading', color: 'blue' },
            { label: 'Finished', color: 'green' },
            { label: 'Abandoned', color: 'red' },
          ]},
          { name: 'Genre', type: 'select', options: [
            { label: 'Fiction', color: 'blue' },
            { label: 'Non-Fiction', color: 'green' },
            { label: 'Sci-Fi', color: 'purple' },
            { label: 'Biography', color: 'orange' },
            { label: 'Self-Help', color: 'teal' },
          ]},
          { name: 'Rating', type: 'rating', config: { max: 5 } },
          { name: 'Pages', type: 'number', config: { decimals: 0 } },
          { name: 'Date Finished', type: 'date' },
          { name: 'Notes', type: 'long_text' },
        ],
        views: [
          { name: 'All Books', type: 'gallery', isDefault: true },
          { name: 'By Status', type: 'board', groupByProperty: 'Status' },
          { name: 'Table', type: 'table' },
        ],
        records: [
          { values: { Title: 'Atomic Habits', Author: 'James Clear', Status: 'Finished', Genre: 'Self-Help', Rating: 5, Pages: 320, 'Date Finished': new Date(Date.now() - 30 * 86400000).toISOString() } },
          { values: { Title: 'Dune', Author: 'Frank Herbert', Status: 'Reading', Genre: 'Sci-Fi', Rating: 4, Pages: 688 } },
          { values: { Title: 'Sapiens', Author: 'Yuval Noah Harari', Status: 'Want to Read', Genre: 'Non-Fiction', Pages: 464 } },
        ],
      },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Track stock levels, locations, and suppliers',
    icon: '📦',
    category: 'business',
    color: 'yellow',
    databases: [
      {
        name: 'Inventory',
        icon: '📦',
        pageIcon: '📦',
        pageTitle: 'Inventory Management',
        pageDescription: 'Track stock levels, locations, and suppliers',
        properties: [
          { name: 'Item', type: 'text', isPrimary: true },
          { name: 'SKU', type: 'text' },
          { name: 'Category', type: 'select', options: [
            { label: 'Electronics', color: 'blue' },
            { label: 'Apparel', color: 'purple' },
            { label: 'Food', color: 'green' },
            { label: 'Hardware', color: 'orange' },
            { label: 'Other', color: 'gray' },
          ]},
          { name: 'Quantity', type: 'number', config: { decimals: 0 } },
          { name: 'Reorder Level', type: 'number', config: { decimals: 0 } },
          { name: 'Unit Price', type: 'currency', config: { symbol: '$', decimals: 2 } },
          { name: 'Supplier', type: 'text' },
          { name: 'Location', type: 'text' },
          { name: 'Status', type: 'status', options: [
            { label: 'In Stock', color: 'green' },
            { label: 'Low Stock', color: 'yellow' },
            { label: 'Out of Stock', color: 'red' },
            { label: 'Discontinued', color: 'gray' },
          ]},
        ],
        views: [
          { name: 'All Items', type: 'table', isDefault: true },
          { name: 'By Status', type: 'board', groupByProperty: 'Status' },
          { name: 'By Category', type: 'board', groupByProperty: 'Category' },
        ],
        records: [
          { values: { Item: 'Wireless Mouse', SKU: 'WM-001', Category: 'Electronics', Quantity: 45, 'Reorder Level': 20, 'Unit Price': 29.99, Supplier: 'TechDist', Location: 'A1-03', Status: 'In Stock' } },
          { values: { Item: 'USB-C Cable', SKU: 'CB-100', Category: 'Electronics', Quantity: 8, 'Reorder Level': 15, 'Unit Price': 12.5, Supplier: 'TechDist', Location: 'A1-05', Status: 'Low Stock' } },
          { values: { Item: 'Office Chair', SKU: 'OC-200', Category: 'Hardware', Quantity: 0, 'Reorder Level': 5, 'Unit Price': 199.0, Status: 'Out of Stock' } },
        ],
      },
    ],
  },
  {
    id: 'daily-planner',
    name: 'Daily Planner',
    description: 'Plan your day with time blocks and priorities',
    icon: '🗓️',
    category: 'productivity',
    color: 'blue',
    databases: [
      {
        name: 'Daily Tasks',
        icon: '🗓️',
        pageIcon: '🗓️',
        pageTitle: 'Daily Planner',
        pageDescription: 'Plan your day with time blocks and priorities',
        properties: [
          { name: 'Task', type: 'text', isPrimary: true },
          { name: 'Time Block', type: 'select', options: [
            { label: 'Morning', color: 'yellow' },
            { label: 'Afternoon', color: 'orange' },
            { label: 'Evening', color: 'blue' },
            { label: 'Night', color: 'purple' },
          ]},
          { name: 'Priority', type: 'status', options: [
            { label: 'Top', color: 'red' },
            { label: 'High', color: 'orange' },
            { label: 'Normal', color: 'blue' },
            { label: 'Low', color: 'gray' },
          ]},
          { name: 'Done', type: 'checkbox' },
          { name: 'Duration (min)', type: 'number', config: { decimals: 0 } },
          { name: 'Date', type: 'date' },
          { name: 'Notes', type: 'long_text' },
        ],
        views: [
          { name: 'Today', type: 'board', isDefault: true, groupByProperty: 'Time Block' },
          { name: 'All Tasks', type: 'table' },
          { name: 'By Priority', type: 'board', groupByProperty: 'Priority' },
        ],
        records: [
          { values: { Task: 'Review emails', 'Time Block': 'Morning', Priority: 'High', Done: true, 'Duration (min)': 30, Date: new Date().toISOString() } },
          { values: { Task: 'Team standup', 'Time Block': 'Morning', Priority: 'Normal', Done: true, 'Duration (min)': 15, Date: new Date().toISOString() } },
          { values: { Task: 'Work on proposal', 'Time Block': 'Afternoon', Priority: 'Top', Done: false, 'Duration (min)': 120, Date: new Date().toISOString() } },
          { values: { Task: 'Gym session', 'Time Block': 'Evening', Priority: 'Normal', Done: false, 'Duration (min)': 60, Date: new Date().toISOString() } },
        ],
      },
    ],
  },
  {
    id: 'team-wiki',
    name: 'Team Wiki',
    description: 'Centralize team docs, decisions, and resources',
    icon: '🏢',
    category: 'business',
    color: 'teal',
    databases: [
      {
        name: 'Documents',
        icon: '🏢',
        pageIcon: '🏢',
        pageTitle: 'Team Wiki',
        pageDescription: 'Centralize team docs, decisions, and resources',
        properties: [
          { name: 'Document', type: 'text', isPrimary: true },
          { name: 'Team', type: 'select', options: [
            { label: 'Engineering', color: 'blue' },
            { label: 'Design', color: 'purple' },
            { label: 'Product', color: 'green' },
            { label: 'Sales', color: 'orange' },
            { label: 'HR', color: 'pink' },
            { label: 'All', color: 'gray' },
          ]},
          { name: 'Type', type: 'status', options: [
            { label: 'Decision', color: 'blue' },
            { label: 'Guide', color: 'green' },
            { label: 'Policy', color: 'orange' },
            { label: 'Meeting Notes', color: 'yellow' },
            { label: 'Reference', color: 'gray' },
          ]},
          { name: 'Owner', type: 'person' },
          { name: 'Last Updated', type: 'date' },
          { name: 'Content', type: 'long_text' },
          { name: 'Tags', type: 'tags', options: [
            { label: 'important', color: 'red' },
            { label: 'onboarding', color: 'blue' },
            { label: 'architecture', color: 'purple' },
          ]},
        ],
        views: [
          { name: 'All Docs', type: 'table', isDefault: true },
          { name: 'By Team', type: 'board', groupByProperty: 'Team' },
          { name: 'By Type', type: 'board', groupByProperty: 'Type' },
        ],
        records: [
          { values: { Document: 'Architecture Overview', Team: 'Engineering', Type: 'Guide', 'Last Updated': new Date().toISOString(), Tags: ['architecture', 'important'] } },
          { values: { Document: 'Q4 OKRs', Team: 'All', Type: 'Decision', 'Last Updated': new Date().toISOString() } },
          { values: { Document: 'New Hire Onboarding', Team: 'HR', Type: 'Guide', Tags: ['onboarding'] } },
        ],
      },
    ],
  },
  {
    id: 'research-notebook',
    name: 'Research Notebook',
    description: 'Track sources, notes, and findings',
    icon: '🔬',
    category: 'education',
    color: 'green',
    databases: [
      {
        name: 'Research Notes',
        icon: '🔬',
        pageIcon: '🔬',
        pageTitle: 'Research Notebook',
        pageDescription: 'Track sources, notes, and findings',
        properties: [
          { name: 'Topic', type: 'text', isPrimary: true },
          { name: 'Source Type', type: 'select', options: [
            { label: 'Paper', color: 'blue' },
            { label: 'Book', color: 'purple' },
            { label: 'Web', color: 'teal' },
            { label: 'Interview', color: 'orange' },
            { label: 'Experiment', color: 'green' },
          ]},
          { name: 'Status', type: 'status', options: [
            { label: 'To Review', color: 'gray' },
            { label: 'Reading', color: 'yellow' },
            { label: 'Analyzed', color: 'green' },
            { label: 'Archived', color: 'red' },
          ]},
          { name: 'URL', type: 'url' },
          { name: 'Notes', type: 'long_text' },
          { name: 'Key Findings', type: 'long_text' },
          { name: 'Date', type: 'date' },
          { name: 'Tags', type: 'tags', options: [
            { label: 'priority', color: 'red' },
            { label: 'follow-up', color: 'orange' },
            { label: 'cited', color: 'blue' },
          ]},
        ],
        views: [
          { name: 'All Notes', type: 'table', isDefault: true },
          { name: 'By Source', type: 'board', groupByProperty: 'Source Type' },
          { name: 'By Status', type: 'board', groupByProperty: 'Status' },
        ],
        records: [
          { values: { Topic: 'Transformer architectures', 'Source Type': 'Paper', Status: 'Analyzed', Notes: 'Attention is all you need - foundational paper.', 'Key Findings': 'Self-attention replaces recurrence.', Date: new Date().toISOString(), Tags: ['cited'] } },
          { values: { Topic: 'User behavior patterns', 'Source Type': 'Interview', Status: 'Reading', Tags: ['follow-up'] } },
        ],
      },
    ],
  },
];

const COVER_GRADIENTS: Record<string, string> = {
  blue: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 50%, #3b82f6 100%)',
  green: 'linear-gradient(135deg, #dcfce7 0%, #86efac 50%, #22c55e 100%)',
  orange: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)',
  pink: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #ec4899 100%)',
  purple: 'linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #6366f1 100%)',
  teal: 'linear-gradient(135deg, #ccfbf1 0%, #5eead4 50%, #14b8a6 100%)',
  yellow: 'linear-gradient(135deg, #fef9c3 0%, #fde047 50%, #eab308 100%)',
  red: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 50%, #ef4444 100%)',
  gray: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #64748b 100%)',
};

export async function instantiateTemplate(
  template: Template,
  workspaceId: string
): Promise<string[]> {
  const createdPageIds: string[] = [];

  for (const tdb of template.databases) {
    const pageId = crypto.randomUUID();
    createdPageIds.push(pageId);

    const cover = COVER_GRADIENTS[template.color] || COVER_GRADIENTS.gray;

    const pageBlock: Partial<Block> = {
      id: pageId,
      workspace_id: workspaceId,
      parent_id: null,
      type: 'page',
      content: tdb.pageTitle,
      properties: {
        icon: tdb.pageIcon,
        cover,
        description: tdb.pageDescription || template.description,
      },
      children: [],
    };

    const { error: pageErr } = await supabase.from('blocks').insert(pageBlock);
    if (pageErr) {
      console.error('Failed to create template page:', pageErr);
      continue;
    }

    const db = await createDatabase(tdb.name);
    await (async () => {
      const updates: Partial<import('./database').Database> = { icon: tdb.icon };
      const { error } = await supabase.from('databases').update(updates).eq('id', db.id);
      if (error) console.error('Failed to set database icon:', error);
    })();

    const propIdMap = new Map<string, string>();
    for (let i = 0; i < tdb.properties.length; i++) {
      const tp = tdb.properties[i];
      const prop = await createProperty(db.id, tp.name, tp.type, i, tp.isPrimary || false, tp.config || {});
      propIdMap.set(tp.name, prop.id);

      if (tp.options) {
        for (let j = 0; j < tp.options.length; j++) {
          await createOption(prop.id, tp.options[j].label, tp.options[j].color, j);
        }
      }
    }

    const optionIdMap = new Map<string, string>();
    for (const [propName, propId] of propIdMap) {
      const tp = tdb.properties.find((p) => p.name === propName);
      if (!tp?.options) continue;
      const { data: opts } = await supabase
        .from('property_options')
        .select('id, label')
        .eq('property_id', propId);
      if (opts) {
        for (const opt of opts) {
          optionIdMap.set(`${propName}::${opt.label}`, opt.id);
        }
      }
    }

    for (let i = 0; i < tdb.views.length; i++) {
      const tv = tdb.views[i];
      const view = await createView(db.id, tv.name, tv.type, i);
      if (tv.isDefault) {
        await updateView(view.id, { is_default: true });
      }
      if (tv.groupByProperty) {
        const gpid = propIdMap.get(tv.groupByProperty);
        if (gpid) {
          await updateView(view.id, { group_by_property: gpid });
        }
      }
    }

    for (let i = 0; i < tdb.records.length; i++) {
      const tr = tdb.records[i];
      const rec = await createRecord(db.id, i);

      for (const [propName, rawValue] of Object.entries(tr.values)) {
        const propId = propIdMap.get(propName);
        if (!propId) continue;

        let value: unknown = rawValue;
        const tp = tdb.properties.find((p) => p.name === propName);

        if (tp && (tp.type === 'select' || tp.type === 'status') && typeof rawValue === 'string') {
          value = optionIdMap.get(`${propName}::${rawValue}`) || rawValue;
        } else if (tp && (tp.type === 'multi_select' || tp.type === 'tags') && Array.isArray(rawValue)) {
          value = rawValue.map((label) => optionIdMap.get(`${propName}::${label}`) || label);
        }

        await upsertValue(rec.id, propId, value);
      }
    }

    const dbBlockId = crypto.randomUUID();
    const dbBlock: Partial<Block> = {
      id: dbBlockId,
      workspace_id: workspaceId,
      parent_id: pageId,
      type: 'database',
      content: '',
      properties: { database_id: db.id },
      children: [],
    };
    const { error: dbBlockErr } = await supabase.from('blocks').insert(dbBlock);
    if (dbBlockErr) {
      console.error('Failed to create database block:', dbBlockErr);
      continue;
    }

    await supabase
      .from('blocks')
      .update({ children: [dbBlockId] })
      .eq('id', pageId);
  }

  return createdPageIds;
}
