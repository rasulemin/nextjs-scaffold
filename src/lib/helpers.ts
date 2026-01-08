import { access, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { logger } from './logger'

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === 'object' && error !== null && 'code' in error
}

/**
 * Checks if a file or directory exists.
 * Returns true if it exists, false if it doesn't.
 * Throws for other errors (permission denied, etc).
 */
export async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path)
        return true
    } catch (error) {
        if (isNodeError(error) && error.code === 'ENOENT') {
            return false
        }
        throw error
    }
}

/**
 * Ensures a file exists at the given path.
 * Throws an error with a custom message if the file doesn't exist.
 */
export async function ensureFileExists(path: string, errorMessage?: string): Promise<void> {
    try {
        await access(path)
    } catch (error) {
        if (isNodeError(error) && error.code === 'ENOENT') {
            throw new Error(errorMessage || `File not found: ${path}`)
        }
        throw new Error(`Failed to access file: ${path}`, { cause: error })
    }
}

/**
 * Attempts to delete a file.
 * Returns true if deleted successfully, false if file doesn't exist.
 * Throws for other errors (permission denied, etc).
 */
export async function tryDeleteFile(path: string): Promise<boolean> {
    try {
        await unlink(path)
        return true
    } catch (error) {
        if (isNodeError(error) && error.code === 'ENOENT') {
            return false
        }
        throw error
    }
}

/**
 * Finds a file by checking multiple possible paths.
 * Returns the full absolute path if found, null otherwise.
 */
export async function findFilePath({
    cwd,
    possiblePaths,
    fileDescription,
}: {
    cwd: string
    possiblePaths: string[]
    fileDescription: string
}): Promise<string | null> {
    for (const path of possiblePaths) {
        const fullPath = join(cwd, path)
        try {
            if (await fileExists(fullPath)) {
                logger.debug(`Found ${fileDescription} at: ${path}`)
                return fullPath
            }
        } catch (error) {
            logger.error(`Error accessing ${path}:`, { error })
            continue
        }
    }

    logger.warn(`Could not find ${fileDescription} file (${possiblePaths.join(', ')})`)
    return null
}
