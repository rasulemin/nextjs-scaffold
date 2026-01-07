import { detect } from 'detect-package-manager'
import { execa } from 'execa'
import { constants, copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isNodeError } from '../../lib/helpers'
import { logger as _logger } from '../../lib/logger'
import { hasPackage, readPackageJson, updatePackageJson } from '../../lib/package-json'

const logger = _logger.withTag('prettier-command')

async function _copyConfigFile({ cwd }: { cwd: string }): Promise<void> {
    // TODO: Stage 1: Use sample config file
    // TODO: Stage 2: Read config from project settings/config
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const sampleConfigFilename = 'config-sample.json'
    const sampleConfigPath = join(__dirname, sampleConfigFilename)

    const configPath = join(cwd, '.prettierrc') // use .json extension?
    logger.debug(`Prettier config path: ${configPath}`)

    try {
        await copyFile(
            sampleConfigPath,
            configPath,
            // fail if the file already exists
            constants.COPYFILE_EXCL,
        )
        logger.success('Prettier config file created')
    } catch (error) {
        if (isNodeError(error) && error.code === 'EEXIST') {
            logger.info('Prettier config file already exists')
            return
        }
        throw new Error('Failed to create Prettier config file', { cause: error })
    }
}

async function _ensurePrettierInstalled({ cwd }: { cwd: string }): Promise<void> {
    try {
        const packageJsonContents = await readPackageJson(cwd)
        if (hasPackage(packageJsonContents, 'prettier')) {
            logger.info('Prettier already installed')
            return
        }
    } catch (error) {
        throw new Error('Failed to check if Prettier is installed', { cause: error })
    }

    logger.info('Installing Prettier')
    const pm = await detect({ cwd })
    const action = pm === 'npm' ? 'install' : 'add'
    try {
        await execa(pm, [action, '-D', 'prettier'], { cwd })
        logger.success('Prettier installed')
    } catch (error) {
        throw new Error('Failed to install Prettier', { cause: error })
    }
}

async function _addFormatScriptToPackageJson({ cwd }: { cwd: string }): Promise<void> {
    try {
        let freshlyAdded = false
        await updatePackageJson(cwd, (pkg) => {
            const currentFormatScript = pkg.scripts?.format
            const targetFormatScript = 'prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"'

            if (currentFormatScript === targetFormatScript) {
                logger.info('Format script already configured correctly')
                return pkg
            }

            if (currentFormatScript) {
                logger.info(
                    `Skipping update. Format script already exists: "${currentFormatScript}".`,
                )
                logger.info(`To update manually, set: "${targetFormatScript}"`)
                return pkg
            }

            freshlyAdded = true
            return {
                ...pkg,
                scripts: { ...pkg.scripts, format: targetFormatScript },
            }
        })
        if (freshlyAdded) logger.success('Added format script to package.json')
    } catch (error) {
        throw new Error('Failed to update package.json with format script', { cause: error })
    }
}

export async function setupPrettier({ cwd }: { cwd: string }): Promise<void> {
    logger.info('Setting up Prettier')
    await _copyConfigFile({ cwd })
    await _ensurePrettierInstalled({ cwd })
    await _addFormatScriptToPackageJson({ cwd })
}
