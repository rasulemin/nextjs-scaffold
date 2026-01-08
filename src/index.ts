import { program } from 'commander'
import { join } from 'node:path'
import { ensureNextJsProject } from './actions/ensure-nextjs-project'
import { validatePrettierConfig } from './actions/validate-prettier-config'
import { cleanUpPublicDir } from './commands/clean-up-public-dir.command'
import { setupEslint } from './commands/eslint/eslint.command'
import { setupPrettier } from './commands/prettier/prettier.command'
import { changeFont } from './commands/change-font.command'
import { updateHomePage } from './commands/update-home-page.command'
import { addContainerUtility } from './commands/add-container-utility.command'
import { fileExists } from './lib/helpers'
import { logger } from './lib/logger'
import { warningPrompt } from './lib/warning-prompt'

const nextJsProjectPathForTesting = process.env.NEXTJS_PROJECT_PATH || '.'

type Options = {
    skipEslint?: boolean
    skipPrettier?: boolean
    skipCleanup?: boolean
    skipHomepage?: boolean
    skipFontChange?: boolean
    skipContainerUtility?: boolean
    prettierConfig?: string
}

async function main(options: Options) {
    const shouldRun = await warningPrompt()
    if (!shouldRun) {
        logger.info('Phew... That was close!')
        return
    }

    const cwd = join(process.cwd(), nextJsProjectPathForTesting)
    if (!(await fileExists(cwd))) {
        logger.error(`Specified cwd is not a valid directory: ${cwd}`)
        process.exit(1)
    }

    logger.info(`Working in directory: ${cwd}`)

    // Validate Prettier config if provided
    if (options.prettierConfig) {
        try {
            await validatePrettierConfig({ configPath: options.prettierConfig })
        } catch (error) {
            logger.error('Invalid or missing Prettier config file', { error })
            process.exit(1)
        }
    }

    try {
        await ensureNextJsProject({ cwd })

        if (!options.skipEslint) {
            await setupEslint({ cwd })
        } else {
            logger.info('Skipping ESLint setup')
        }

        if (!options.skipCleanup) {
            await cleanUpPublicDir({ cwd })
        } else {
            logger.info('Skipping public directory cleanup')
        }

        if (!options.skipHomepage) {
            await updateHomePage({ cwd })
        } else {
            logger.info('Skipping homepage update')
        }

        if (!options.skipFontChange) {
            await changeFont({ cwd })
        } else {
            logger.info('Skipping font change')
        }

        if (!options.skipContainerUtility) {
            await addContainerUtility({ cwd })
        } else {
            logger.info('Skipping container utility')
        }

        if (!options.skipPrettier) {
            await setupPrettier({ cwd, prettierConfigPath: options.prettierConfig })
        } else {
            logger.info('Skipping Prettier setup')
        }

        logger.success('✨ Setup complete!')
    } catch (error) {
        logger.error('Setup Failed', { error })
        process.exit(1)
    }
}

program
    .name('next-scaffold')
    .description('A scaffolding tool for fresh Next.js projects')
    .version('1.0.0')
    .option('--skip-eslint', 'Skip ESLint setup')
    .option('--skip-prettier', 'Skip Prettier setup')
    .option('--skip-cleanup', 'Skip public directory cleanup')
    .option('--skip-homepage', 'Skip homepage update')
    .option('--skip-font-change', 'Skip font change (Geist to Inter)')
    .option('--skip-container-utility', 'Skip adding container utility to globals.css')
    .option('--prettier-config <path>', 'Path to custom Prettier config file')
    .action(main)

program.parse()
