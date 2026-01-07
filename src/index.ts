import { join } from 'node:path'
import { ensureNextJsProject } from './actions/ensure-nextjs-project'
import { setupPrettier } from './commands/prettier/prettier.command'
import { logger } from './lib/logger'

const nextJsProjectPathForTesting = process.env.NEXTJS_PROJECT_PATH || '.'

async function main() {
    const cwd = join(process.cwd(), nextJsProjectPathForTesting)
    logger.info(`Working in directory: ${cwd}`)
    try {
        const packageJsonContents = await ensureNextJsProject({ cwd })
        await setupPrettier({ cwd, packageJsonContents })
    } catch (error) {
        logger.error('Setup Failed', { error })
        process.exit(1)
    }
}

void main()
