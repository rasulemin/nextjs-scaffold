import { detect, PM } from 'detect-package-manager'
import { execa } from 'execa'
import { copyFile, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isNodeError } from '../../lib/helpers'
import { logger as _logger } from '../../lib/logger'
import { confirmPrompt } from '../../lib/prompt'

const logger = _logger.withTag('setup-eslint')

const CONFIG = {
    possibleConfigExtensions: ['mjs', 'js', 'cjs', 'ts', 'mts', 'cts'],
    // When creating a new config file, this extension will be used
    defaultConfigExtension: 'mjs',
    /**
     * @see https://github.com/antfu/eslint-config#manual-install
     * @see https://github.com/antfu/eslint-config#nextjs
     */
    requiredPackages: ['eslint', '@antfu/eslint-config', '@next/eslint-plugin-next'],
}

/**
 * Installs the required ESLint dependencies.
 */
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

/**
 * Deletes any existing ESLint config files.
 */
async function _deleteExistingConfigs({ cwd }: { cwd: string }): Promise<void> {
    let deletedCount = 0

    for (const ext of CONFIG.possibleConfigExtensions) {
        const configPath = join(cwd, `eslint.config.${ext}`)
        try {
            await unlink(configPath)
            logger.info(`Deleted existing eslint.config.${ext}`)
            deletedCount++
        } catch (error) {
            if (isNodeError(error) && error.code === 'ENOENT') {
                // File doesn't exist, skip
                continue
            }
            // Other errors should be thrown
            throw new Error(`Failed to delete eslint.config.${ext}`, { cause: error })
        }
    }

    if (deletedCount === 0) {
        logger.info('No existing ESLint config files found')
    }
}

/**
 * Copies the sample ESLint config file to the project root.
 */
async function _copyConfigFile({ cwd }: { cwd: string }): Promise<void> {
    // TODO: Add ability to configure the config file
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const sampleConfigPath = join(__dirname, 'eslint.config.mjs')

    const targetConfigFileName = `eslint.config.${CONFIG.defaultConfigExtension}`
    const targetConfigPath = join(cwd, targetConfigFileName)

    try {
        await copyFile(sampleConfigPath, targetConfigPath)
        logger.success(`ESLint config file created: ${targetConfigFileName}`)
    } catch (error) {
        throw new Error('Failed to create ESLint config file', { cause: error })
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

    // 2. Delete any existing config files
    await _deleteExistingConfigs({ cwd })

    // 3. Copy the config file to the project root
    await _copyConfigFile({ cwd })

    // TODO: run formatter on the config file

    // 4. add new "lint:fix" script to package.json that runs "eslint --fix"
    // 5. run the "lint:fix" script
}
