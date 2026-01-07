import { detect, PM } from 'detect-package-manager'
import { execa } from 'execa'
import { confirmPrompt } from '../../lib/prompt'
import { logger as _logger } from '../../lib/logger'

const logger = _logger.withTag('setup-eslint')

const CONFIG = {
    // By default Next.js creates `eslint.config.mjs` file.
    defaultConfigExtension: 'mjs',
    otherPossibleConfigExtensions: ['js', 'cjs', 'ts', 'mts', 'cts'],
    /**
     * @see https://github.com/antfu/eslint-config#manual-install
     * @see https://github.com/antfu/eslint-config#nextjs
     */
    requiredPackages: ['eslint', '@antfu/eslint-config', '@next/eslint-plugin-next'],
}

async function _installDependencies({
    cwd,
    packageManager,
}: {
    cwd: string
    packageManager: PM
}): Promise<void> {
    logger.info(`Installing ESLint packages: ${CONFIG.requiredPackages.join(', ')}`)
    const action = packageManager === 'npm' ? 'install' : 'add'

    try {
        await execa(packageManager, [action, '-D', ...CONFIG.requiredPackages], {
            cwd,
            stdio: 'inherit',
        })
        logger.success('ESLint packages installed')
    } catch (error) {
        throw new Error('Failed to install ESLint packages', { cause: error })
    }
}

export async function setupEslint({ cwd }: { cwd: string }): Promise<void> {
    const shouldSetup = await confirmPrompt('Setup ESLint?')
    if (!shouldSetup) {
        logger.info('Skipping ESLint setup')
        return
    }

    const packageManager = await detect({ cwd })

    // 1. Install deps
    await _installDependencies({ cwd, packageManager })

    // 2. by default next.js creats *.mjs file, so check for that specific file. if it doesn't exist, check other possible extensions. if neither exist, use the default file extension (mjs).
    // 3. copy the config file to the project root
    // 4. add new "lint:fix" script to package.json that runs "eslint --fix"
    // 5. run the "lint:fix" script
}
