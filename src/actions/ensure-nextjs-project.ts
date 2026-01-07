import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isNodeError } from '../lib/helpers'
import { logger as _logger } from '../lib/logger'

const logger = _logger.withTag('ensure-nextjs-project')

const NEXT_CONFIG_FILES = ['next.config.js', 'next.config.mjs', 'next.config.ts', 'next.config.cjs']

interface PackageJson {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
}

class ValidationError extends Error {
    constructor(message: string, options?: { cause?: unknown }) {
        super(message, options)
        this.name = 'ValidationError'
    }
}

/**
 * This is a helper function to ensure the user is in a Next.js project before running any commands.
 * Exits the process with an error if it isn't.
 */
export async function ensureNextJsProject({ cwd }: { cwd: string }): Promise<void> {
    // Check if package.json exists
    const packageJsonPath = join(cwd, 'package.json')
    logger.debug(`Checking if package.json exists at ${packageJsonPath}`)

    try {
        const contents = await readFile(packageJsonPath, 'utf-8')
        const contentsJson = JSON.parse(contents) as PackageJson

        // Check if dep is installed
        const hasDependency =
            (contentsJson.dependencies && 'next' in contentsJson.dependencies) ||
            (contentsJson.devDependencies && 'next' in contentsJson.devDependencies)
        logger.debug(`Checking if 'next' dependency is installed: ${hasDependency}`)
        if (!hasDependency) {
            throw new ValidationError(
                "This doesn't appear to be a Next.js project: missing 'next' dependency",
            )
        }

        // Check for next config file
        const hasNextConfig = NEXT_CONFIG_FILES.some((file) => existsSync(join(cwd, file)))
        logger.debug(`Checking if next config file exists: ${hasNextConfig}`)
        if (!hasNextConfig) {
            throw new ValidationError(
                "This doesn't appear to be a Next.js project: missing next.config.* file",
            )
        }

        logger.success('Next.js project detected')
    } catch (err) {
        // Re-throw our custom errors as is
        if (err instanceof ValidationError) throw err

        if (isNodeError(err) && err.code === 'ENOENT') {
            throw new Error('No package.json found in the current directory.')
        }

        throw new Error('Failed to read package.json file', { cause: err })
    }
}
