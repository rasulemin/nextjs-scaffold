import { detect, PM } from 'detect-package-manager'
import { execa } from 'execa'
import { copyFile, mkdir, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isNodeError } from '../../lib/helpers'
import { logger as _logger } from '../../lib/logger'
import { updatePackageJson } from '../../lib/package-json'

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
    lintFixScriptName: 'lint:fix',
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

/**
 * Adds `lint:fix` script to package.json.
 */
async function _addLintFixScript({ cwd }: { cwd: string }): Promise<void> {
    try {
        let freshlyAdded = false
        await updatePackageJson(cwd, (pkg) => {
            const currentLintFixScript = pkg.scripts?.[CONFIG.lintFixScriptName]
            const targetLintFixScript = 'eslint . --fix'

            if (currentLintFixScript === targetLintFixScript) {
                logger.info(`\`${CONFIG.lintFixScriptName}\` script already configured correctly`)
                return pkg
            }

            if (currentLintFixScript) {
                logger.info(
                    `Skipping update. \`${CONFIG.lintFixScriptName}\` script already exists: "${currentLintFixScript}".`,
                )
                logger.info(`To update manually, set: "${targetLintFixScript}"`)
                return pkg
            }

            freshlyAdded = true
            return {
                ...pkg,
                scripts: { ...pkg.scripts, [CONFIG.lintFixScriptName]: targetLintFixScript },
            }
        })
        if (freshlyAdded)
            logger.success(`Added \`${CONFIG.lintFixScriptName}\` script to package.json`)
    } catch (error) {
        throw new Error(
            `Failed to update package.json with \`${CONFIG.lintFixScriptName}\` script`,
            { cause: error },
        )
    }
}

/**
 * Runs ESLint fix on the entire codebase.
 */
async function _runLintFix({
    cwd,
    packageManager,
}: {
    cwd: string
    packageManager: PM
}): Promise<void> {
    try {
        logger.info('Running ESLint --fix...')
        await execa(packageManager, ['run', CONFIG.lintFixScriptName], { cwd, stdio: 'inherit' })
        logger.success('Codebase linted and fixed')
    } catch (error) {
        logger.error('Linting error occurred', { error })
        logger.warn(
            `Failed to lint codebase. You can run the \`${CONFIG.lintFixScriptName}\` script manually.`,
        )
    }
}

/**
 * Formats the newly created/copied file (just in case the formatting is off).
 */
async function _formatFile({
    cwd,
    packageManager,
    filePath,
}: {
    cwd: string
    packageManager: PM
    filePath: string
}): Promise<void> {
    try {
        logger.info(`Formatting ${filePath}...`)
        await execa(packageManager, ['exec', 'prettier', '--write', filePath], {
            cwd,
            stdio: 'pipe',
        })
        logger.success(`${filePath} formatted`)
    } catch (error) {
        // Non-critical: just log a warning if formatting fails
        logger.warn(`Failed to format ${filePath}. You can format it manually.`)
        logger.debug('Formatting error:', { error })
    }
}

/**
 * Copies VSCode settings.json with recommended ESLint configuration.
 */
async function _copyVscodeSettings({ cwd }: { cwd: string }): Promise<void> {
    // TODO: REUSE/ABSTRACTAWAY
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const sourceSettingsPath = join(__dirname, '.vscode', 'settings.json')
    const targetVscodeDir = join(cwd, '.vscode')
    const targetSettingsPath = join(targetVscodeDir, 'settings.json')

    try {
        logger.info('Copying VSCode settings...')
        // Create .vscode directory if it doesn't exist
        await mkdir(targetVscodeDir, { recursive: true })
        await copyFile(sourceSettingsPath, targetSettingsPath)
        logger.success('VSCode settings created with ESLint configuration')
    } catch (error) {
        if (isNodeError(error) && error.code === 'EEXIST') {
            logger.info('VSCode settings already exist, skipping')
            return
        }
        // Non-critical: just log a warning if copying fails
        logger.warn('Failed to copy VSCode settings. You can set it up manually.')
        logger.debug('Copy error:', { error })
    }
}

export async function setupEslint({ cwd }: { cwd: string }): Promise<void> {
    const packageManager = await detect({ cwd })

    // 1. Install deps
    await _installDependencies({ cwd, packageManager })

    // 2. Delete any existing config files
    await _deleteExistingConfigs({ cwd })

    // 3. Copy the config file to the project root
    await _copyConfigFile({ cwd })
    const configFileName = `eslint.config.${CONFIG.defaultConfigExtension}`
    const configPath = join(cwd, configFileName)
    await _formatFile({ cwd, packageManager, filePath: configPath })

    // 4. Add `lint:fix` script to package.json
    await _addLintFixScript({ cwd })

    // 5. Run the `lint:fix` script
    await _runLintFix({ cwd, packageManager })

    // 6. Copy vscode settings
    await _copyVscodeSettings({ cwd })
    const vscodeSettingsPath = join(cwd, '.vscode/settings.json')
    await _formatFile({ cwd, packageManager, filePath: vscodeSettingsPath })

    // 7. Format package.json file (in case it was modified)
    const packageJsonPath = join(cwd, 'package.json')
    await _formatFile({ cwd, packageManager, filePath: packageJsonPath })
}
