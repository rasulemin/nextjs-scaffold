import { writeFile } from 'node:fs/promises'
import { findFilePath } from '../lib/helpers'
import { logger as _logger } from '../lib/logger'

const logger = _logger.withTag('update-home-page')

const HOME_PAGE_CONTENTS = `export default function HomePage() {
    return null
}
`

/**
 * Replaces the home page content with a simple version.
 */
export async function updateHomePage({ cwd }: { cwd: string }): Promise<void> {
    logger.info('Updating home page...')

    const homePagePath = await findFilePath({
        cwd,
        possiblePaths: ['src/app/page.tsx', 'app/page.tsx'],
        fileDescription: 'home page',
    })
    if (!homePagePath) {
        return
    }

    try {
        await writeFile(homePagePath, HOME_PAGE_CONTENTS, 'utf-8')
        logger.success('Home page updated successfully')
    } catch (error) {
        logger.error('Failed to update home page. Please update it manually.', { error })
    }
}
