import { router } from '../../lib/trpc'
import { budgetCategoriesRouter } from './budget-categories'
import { budgetsRouter } from './budgets'
import { budgetPlansRouter } from './budget-plans'
import { transactionsRouter } from './transactions'
import { aiRouter } from './ai'
import { dashboardRouter } from './dashboard'
import { alertsRouter } from './alerts'
import { goalsRouter } from './goals'
import { settingsRouter } from './settings'

export const financialRouter = router({
  // Core financial modules
  categories: budgetCategoriesRouter,
  budgets: budgetsRouter,
  budgetPlans: budgetPlansRouter,
  transactions: transactionsRouter,
  
  // AI-powered features
  ai: aiRouter,
  
  // Dashboard and reports
  dashboard: dashboardRouter,
  
  // Alerts and notifications
  alerts: alertsRouter,
  
  // Financial goals
  goals: goalsRouter,
  
  // Settings and configuration
  settings: settingsRouter
})