import { parseEnv } from '../env'

/**
 * Parses and validates the runtime environment variables.
 *
 * This module exports the result of parsing the process environment variables
 * using the parseEnv function from the '../env' module, providing a validated
 * and typed representation of the runtime environment.
 */
// eslint-disable-next-line node/prefer-global/process
export default parseEnv(process.env)
