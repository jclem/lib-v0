import {readFile, readFileSync} from 'node:fs'
import * as z from 'zod'

/** A {@link z.ZodObject} definition used to define config */
export type ConfigType = z.ZodObject<z.ZodRawShape>

/**
 * Create a new {@link Config} instance for a given {@link ConfigType}.
 *
 * @example
 * ```ts
 * const config = newConfig(z.object({
 *   foo: z.string()
 * }))
 *  .readEnv()
 *  .parse()
 *
 * console.log(config.foo) // process.env['FOO']
 * ```
 */
export function newConfig<T extends ConfigType>(schema: T): Config<T> {
  return new Config(schema)
}

/**
 * A tuple comprising a file path and a function to parse the contents of that file
 */
export type FileEntry = [path: string, parse: (contents: Buffer) => unknown]

type ReadValue = {type: 'value'; value: Record<string, unknown>}
type ReadFile = {type: 'file'; value: FileEntry}
type ReadEnv = {type: 'env'}

type ReadIn = ReadValue | ReadFile | ReadEnv

class Config<T extends ConfigType> {
  private readonly schema: T
  private reads: ReadIn[] = []

  constructor(schema: T) {
    this.schema = schema
  }

  /**
   * Read config values directly from the given record(s).
   *
   * @remarks
   * Can be called with a variadic list of values or can be called multiple
   * times to build up a list of values.
   *
   * @example
   * newConfig(schema).readValue({foo: 'bar'}, {baz: 'qux'}).parse()
   */
  readValue(...values: Record<string, unknown>[]): this {
    for (const value of values) {
      this.reads.push({type: 'value', value})
    }

    return this
  }

  /**
   * Read config values from the given JSON config file(s).
   *
   * @remarks
   * Can be called with a variadic list of config file paths or can be called
   * multiple times to build up a list of config files to read from.
   *
   * A {@link FileEntry}—a type comprising file path and a parse function—can be
   * passed to parse non-JSON files.
   *
   * @example
   * ```typescript
   * newConfig(Config)
   *  .readFile('config.json', ['config2.yaml', yaml.parse])
   *  .readFile(['config.toml', toml.parse])
   *  .parse()
   * ```
   *
   * Reading is not done until {@link parseAsync} or {@link parse} is called.
   *
   * @param filePaths The paths to the config file(s) to read
   */
  readFile(...filePaths: (string | FileEntry)[]): this {
    for (const file of filePaths) {
      const value: FileEntry = isFileEntry(file) ? file : [file, this.parseFile]
      this.reads.push({type: 'file', value})
    }

    return this
  }

  /**
   * Read config values from environment variables.
   */
  readEnv(): this {
    this.reads.push({type: 'env'})
    return this
  }

  /**
   * Asynchronously parse the values, config files, and environment (if enabled)
   * into a configuration object matching the schema given to {@link newConfig}.
   *
   * @remarks
   * - The inputs will be read in the order they were added to the config.
   *
   * @returns A promise that resolves to the parsed configuration object.
   */
  async parseAsync(): Promise<z.infer<T>> {
    const input = await this.getInputAsync()
    return this.schema.parseAsync(input)
  }

  /**
   * Asynchronously safely parse the values, config files, and environment (if
   * enabled) into a configuration object matching the schema given to {@link
   * newConfig}.
   *
   * @remarks
   * - The inputs will be read in the order they were added to the config.
   * - This calls `safeParseAsync` on the Zod schema.
   *
   * @returns A promise that resolves to the parsed configuration object.
   */
  async safeParseAsync(): Promise<z.SafeParseReturnType<unknown, z.infer<T>>> {
    const input = await this.getInputAsync()
    const result = await this.schema.safeParseAsync(input)
    return result
  }

  /**
   * Synchronously parse the values, config files, and environment (if enabled)
   * into a configuration object matching the schema given to {@link newConfig}.
   *
   * @remarks
   * - The inputs will be read in the order they were added to the config.
   *
   * @returns The parsed configuration object.
   */
  parse(): z.infer<T> {
    const input = this.getInput()
    return this.schema.parse(input)
  }

  /**
   * Synchronously parse the values, config files, and environment (if enabled)
   * into a configuration object matching the schema given to {@link newConfig}.
   *
   * @remarks
   * - The inputs will be read in the order they were added to the config.
   * - This calls `safeParse` on the Zod schema.
   *
   * @returns The parsed configuration object.
   */
  safeParse(): z.SafeParseReturnType<unknown, z.infer<T>> {
    const input = this.getInput()
    const output = this.schema.safeParse(input)
    return output
  }

  private async getInputAsync() {
    const resolvedReads = await Promise.all(
      this.reads.map(async read => {
        switch (read.type) {
          case 'value':
            return read.value
          case 'file':
            return new Promise<Record<string, unknown>>((resolve, reject) => {
              const [path, parse] = read.value

              readFile(path, (err, data) => {
                if (err != null) {
                  reject(err)
                  return
                }

                const readData = parse(data)

                if (!isRecord(readData)) {
                  reject(
                    new Error(
                      `Expected ${path} to parse to a record with string keys, but it parsed to a ${typeof readData}`
                    )
                  )
                  return
                }

                resolve(readData)
              })
            })
          case 'env':
            return this.readInEnv()
        }
      })
    )

    return deepMerge(...resolvedReads)
  }

  private getInput() {
    const resolvedReads = this.reads.map(read => {
      switch (read.type) {
        case 'value':
          return read.value
        case 'file': {
          const [path, parse] = read.value
          const parsedData = parse(readFileSync(path))

          if (!isRecord(parsedData)) {
            throw new Error(
              `Expected ${path} to parse to a record with string keys, but it parsed to a ${typeof parsedData}`
            )
          }

          return parsedData
        }
        case 'env':
          return this.readInEnv()
      }
    })

    return deepMerge(...resolvedReads)
  }

  private parseFile(data: Buffer): Record<string, unknown> {
    const parsedData = JSON.parse(data.toString())

    if (!isRecord(parsedData)) {
      throw new Error('Expected file to parse to a record with string keys')
    }

    return parsedData
  }

  // Iterate over the schema shape recursively, and read values out of
  // environment variables. A value at the path `foo.bar.baz` should be read
  // from `FOO__BAR__BAZ`, and a value at the path `fooBar.baz` should be read
  // from `FOO_BAR__BAZ`.
  private readInEnv(): Record<string, unknown> {
    const readEnvValue = (path: string[]) => {
      const envVarName = path
        .map(p =>
          p
            .split(/(?=[A-Z])/)
            .map(s => s.toUpperCase())
            .join('_')
        )
        .join('__')
      return process.env[envVarName]
    }

    const input: Record<string, unknown> = {}

    const readEnv = (path: string[], schema: object) => {
      if (isZodObject(schema)) {
        for (const key in schema.shape) {
          readEnv([...path, key], schema.shape[key])
        }
      } else if (isZodDefault(schema)) {
        readEnv(path, schema._def.innerType)
      } else {
        const value = readEnvValue(path)

        if (value != null) {
          let inputPosition = input

          for (let i = 0; i < path.length; i++) {
            const key = path[i]

            if (i === path.length - 1) {
              inputPosition[key] = value
            } else {
              inputPosition[key] ??= {}
              inputPosition = inputPosition[key] as Record<string, unknown>
            }
          }
        }
      }
    }

    readEnv([], this.schema)
    console.log('input', input)

    return input
  }
}

function isZodObject(value: object): value is z.ZodObject<z.ZodRawShape> {
  return value instanceof z.ZodObject
}

function isZodDefault(value: object): value is z.ZodDefault<z.ZodTypeAny> {
  return value instanceof z.ZodDefault
}

function deepMerge(...objects: Record<string, unknown>[]) {
  return objects.reduce((output, object) => {
    for (const key in object) {
      const outputValue = output[key]
      const objectValue = object[key]
      if (isRecord(outputValue) && isRecord(objectValue)) {
        output[key] = deepMerge(outputValue, objectValue)
      } else {
        output[key] = object[key]
      }
    }

    return output
  }, {})
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value)
}

function isFileEntry(v: string | FileEntry): v is FileEntry {
  return Array.isArray(v)
}
