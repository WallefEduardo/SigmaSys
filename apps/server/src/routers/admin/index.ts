import { router } from '../../lib/trpc'
import { aiConfigRouter } from './ai-config'

export const adminRouter = router({
  ai: aiConfigRouter
})