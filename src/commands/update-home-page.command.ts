import { writeFile } from 'node:fs/promises'
import { findFilePath } from '../lib/helpers'
import { logger as _logger } from '../lib/logger'

const logger = _logger.withTag('update-home-page')

const GREETING_PHRASES = [
    'Hello, handsome!',
    'This project is going to be a killer!',
    "Let's ship something great!",
    'Ready to build something legendary?',
    'Time to create some magic! ✨',
]

function getRandomPhrase(): string {
    return GREETING_PHRASES[Math.floor(Math.random() * GREETING_PHRASES.length)]
}

function getHomePageContents(): string {
    const phrase = getRandomPhrase()
    return `export default function HomePage() {
    return (
        <div className="container py-10">
            <h1 className="text-4xl font-bold tracking-tight">
                ${phrase}
            </h1>
        </div>
    )
}
`
}

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
        await writeFile(homePagePath, getHomePageContents(), 'utf-8')
        logger.success('Home page updated successfully')
    } catch (error) {
        logger.error('Failed to update home page. Please update it manually.', { error })
    }
}
