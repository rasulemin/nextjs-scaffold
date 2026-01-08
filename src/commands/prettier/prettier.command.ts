import { detect, PM } from 'detect-package-manager'
import { execa } from 'execa'
import { copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fileExists } from '../../lib/helpers'
import { logger as _logger } from '../../lib/logger'
import {
    hasPackage,
    readPackageJson,
    updatePackageJsonScripts,
} from '../../lib/package-json'

const logger = _logger.withTag('prettier-command')

/**
 * Copies Prettier config file to the project root.
 * Uses custom config if provided, otherwise uses built-in .prettierrc
 * Skips if a config file already exists.
 */
async function _copyConfigFile({
    cwd,
    customConfigPath,
}: {
    cwd: string
    customConfigPath?: string
}): Promise<void> {
    const targetConfigPath = join(cwd, '.prettierrc')

    // Check if config already exists
    if (await fileExists(targetConfigPath)) {
        logger.info('Prettier config file already exists')
        return
    }

    // Determine source config path
    let sourceConfigPath: string
    if (customConfigPath) {
        sourceConfigPath = customConfigPath
        logger.info(`Using custom Prettier config from: ${customConfigPath}`)
    } else {
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = dirname(__filename)
        sourceConfigPath = join(__dirname, '.prettierrc')
        logger.info('Using built-in Prettier config')
    }

    // Copy config file
    try {
        await copyFile(sourceConfigPath, targetConfigPath)
        logger.success('Prettier config file created')
    } catch (error) {
        throw new Error('Failed to create Prettier config file', {
            cause: error,
        })
    }
}

/**
 * Checks if Prettier is installed and installs it as a dev dependency if not.
 */
async function _ensurePrettierInstalled({
    cwd,
    packageManager,
}: {
    cwd: string
    packageManager: PM
}): Promise<void> {
    try {
        const packageJsonContents = await readPackageJson(cwd)
        if (hasPackage(packageJsonContents, 'prettier')) {
            logger.info('Prettier already installed')
            return
        }
    } catch (error) {
        throw new Error('Failed to check if Prettier is installed', {
            cause: error,
        })
    }

    logger.info('Installing Prettier')
    const action = packageManager === 'npm' ? 'install' : 'add'
    try {
        await execa(packageManager, [action, '-D', 'prettier'], {
            cwd,
            stdio: 'inherit',
        })
        logger.success('Prettier installed')
    } catch (error) {
        throw new Error('Failed to install Prettier', { cause: error })
    }
}

/**
 * Adds a "format" script to package.json if it doesn't exist.
 * Skips if a format script is already configured.
 */
async function _addFormatScriptToPackageJson({
    cwd,
}: {
    cwd: string
}): Promise<void> {
    try {
        let freshlyAdded = false
        await updatePackageJsonScripts(cwd, (scripts) => {
            const currentFormatScript = scripts.format
            const targetFormatScript = 'prettier . --write'

            if (currentFormatScript === targetFormatScript) {
                logger.info('Format script already configured correctly')
                return scripts
            }

            if (currentFormatScript) {
                logger.info(
                    `Skipping update. Format script already exists: "${currentFormatScript}".`,
                )
                logger.info(`To update manually, set: "${targetFormatScript}"`)
                return scripts
            }

            freshlyAdded = true
            return {
                ...scripts,
                format: targetFormatScript,
            }
        })
        if (freshlyAdded) logger.success('Added format script to package.json')
    } catch (error) {
        throw new Error('Failed to update package.json with format script', {
            cause: error,
        })
    }
}

/**
 * Prompts the user to format the entire codebase.
 * Runs the "format" script if confirmed (default: yes).
 */
async function _formatCodebase({
    cwd,
    packageManager,
}: {
    cwd: string
    packageManager: PM
}): Promise<void> {
    try {
        logger.info('Formatting codebase...')
        await execa(packageManager, ['run', 'format'], {
            cwd,
            stdio: 'inherit',
        })
        logger.success('Codebase formatted')
    } catch (error) {
        logger.error('Formatting error occurred', { error })
        logger.warn(
            'Failed to format codebase. You can run the `format` script manually.',
        )
    }
}

/**
 * Main function to set up Prettier in a Next.js project.
 */
export async function setupPrettier({
    cwd,
    prettierConfigPath,
}: {
    cwd: string
    prettierConfigPath?: string
}): Promise<void> {
    logger.info('Setting up Prettier')
    await _copyConfigFile({ cwd, customConfigPath: prettierConfigPath })
    const pm = await detect({ cwd })
    await _ensurePrettierInstalled({ cwd, packageManager: pm })
    await _addFormatScriptToPackageJson({ cwd })
    await _formatCodebase({ cwd, packageManager: pm })
}
