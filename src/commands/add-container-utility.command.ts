import { readFile, writeFile } from 'node:fs/promises'
import { findFilePath } from '../lib/helpers'
import { logger as _logger } from '../lib/logger'

const logger = _logger.withTag('add-container-utility')

const CONTAINER_UTILITY = `
@utility container {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full;
}
`

/**
 * Adds a container utility class to globals.css.
 * The utility provides consistent max-width, centering, and responsive padding.
 */
export async function addContainerUtility({ cwd }: { cwd: string }): Promise<void> {
    logger.info('Adding container utility to globals.css...')

    const globalsPath = await findFilePath({
        cwd,
        possiblePaths: ['src/app/globals.css', 'app/globals.css'],
        fileDescription: 'globals.css',
    })

    if (!globalsPath) {
        return
    }

    try {
        // Read existing content
        const existingContent = await readFile(globalsPath, 'utf-8')

        // Check if container utility already exists
        if (existingContent.includes('@utility container')) {
            logger.info('Container utility already exists in globals.css')
            return
        }

        // Append the container utility
        const newContent = existingContent.trimEnd() + '\n' + CONTAINER_UTILITY

        await writeFile(globalsPath, newContent, 'utf-8')
        logger.success('Container utility added to globals.css successfully')
    } catch (error) {
        logger.error('Failed to add container utility. Please update globals.css manually.', {
            error,
        })
    }
}
