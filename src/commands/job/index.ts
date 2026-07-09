import { feature } from 'bun:bundle'
import type { Command } from '../../commands.js'

const job = {
  type: 'local-jsx',
  name: 'job',
  description: 'Manage template jobs',
  argumentHint: '[list|new|reply|status]',
  isEnabled: () => {
    if (feature('TEMPLATES')) return true
    return false
  },
  load: () => import('./job.js'),
} satisfies Command

export default job
