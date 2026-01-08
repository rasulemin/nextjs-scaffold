import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export type TPackageJson = {
    name?: string
    version?: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
}

/**
 * Reads and parses package.json from the given directory.
 */
export async function readPackageJson(cwd: string): Promise<TPackageJson> {
    const packageJsonPath = join(cwd, 'package.json')
    const contents = await readFile(packageJsonPath, 'utf-8')
    return JSON.parse(contents) as TPackageJson
}

/**
 * Writes package.json to the given directory.
 */
export async function writePackageJson(cwd: string, packageJson: TPackageJson): Promise<void> {
    const packageJsonPath = join(cwd, 'package.json')
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')
}

/**
 * Checks if a package exists in dependencies or devDependencies.
 */
export function hasPackage(packageJson: TPackageJson, packageName: string): boolean {
    return !!(packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName])
}

/**
 * Adds or updates a key-value pair in a specific object field of package.json.
 * Works for scripts, dependencies, devDependencies, etc.
 */
export function updateObjectField<T extends keyof TPackageJson>(
    packageJson: TPackageJson,
    fieldName: T,
    key: string,
    value: string,
): TPackageJson {
    const currentField = packageJson[fieldName]

    return {
        ...packageJson,
        [fieldName]: {
            ...(currentField && typeof currentField === 'object' ? currentField : {}),
            [key]: value,
        },
    }
}

/**
 * Updates scripts in package.json using an updater function.
 * Reads the current package.json, applies script updates, and writes it back.
 *
 * @example
 * await updatePackageJsonScripts(cwd, (scripts) => ({
 *   ...scripts,
 *   format: 'prettier --write .'
 * }))
 */
export async function updatePackageJsonScripts(
    cwd: string,
    updater: (currentScripts: Record<string, string>) => Record<string, string>,
): Promise<void> {
    const current = await readPackageJson(cwd)
    const currentScripts = current.scripts || {}
    const updatedScripts = updater(currentScripts)
    const updated = { ...current, scripts: updatedScripts }
    await writePackageJson(cwd, updated)
}
