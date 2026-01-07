import { join } from 'node:path'
import { ensureNextJsProject } from './actions/ensure-nextjs-project'
import { setupPrettier } from './commands/prettier/prettier.command'
import { logger } from './lib/logger'
import { access } from 'node:fs/promises'

const nextJsProjectPathForTesting = process.env.NEXTJS_PROJECT_PATH || '.'

async function main() {
    const cwd = join(process.cwd(), nextJsProjectPathForTesting)
    const cwdExists = await access(cwd)
        .then(() => true)
        .catch(() => false)
    if (!cwdExists) {
        logger.error(`Specified cwd is not a valid directory: ${cwd}`)
        process.exit(1)
    }

    logger.info(`Working in directory: ${cwd}`)

    try {
        await ensureNextJsProject({ cwd })
        await setupPrettier({ cwd })
    } catch (error) {
        logger.error('Setup Failed', { error })
        process.exit(1)
    }
}

void main()
