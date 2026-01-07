import { constants, copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isNodeError } from '../../lib/helpers'
import { logger as _logger } from '../../lib/logger'

const logger = _logger.withTag('prettier-command')

// TODO: Stage 1: Use sample config file
// TODO: Stage 2: Read config from project settings/config
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const sampleConfigFilename = 'config-sample.json'
const sampleConfigPath = join(__dirname, sampleConfigFilename)

export async function configurePrettier({ cwd }: { cwd: string }): Promise<void> {
    logger.info('Configuring Prettier')

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
