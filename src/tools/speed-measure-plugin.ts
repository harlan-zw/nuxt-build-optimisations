import { existsSync } from 'fs'
import { resolve } from 'upath'
import { sync as rimrafSync } from 'rimraf'
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin'
import { Configuration as WebpackConfiguration } from 'webpack'
import type { OptimisationArgs } from '../types'
import logger from '../logger'
/* Speed Measure Plugin: https://www.npmjs.com/package/speed-measure-webpack-plugin */
export default ({ options }: OptimisationArgs, nuxt: any) => {
  if (!options.measure)
    return

  // breaks if SSR is off for some reason
  if (!nuxt.options.ssr) {
    options.measure = false
    logger.warn('SpeedMeasurePlugin has not been enabled because SSR mode is off.')
    return
  }
  // running in test mode does not seem like a good idea
  if (process.env.NODE_ENV === 'test') {
    options.measure = false
    logger.warn('SpeedMeasurePlugin has been disabled because of the testing environment.')
    return
  }
  // remove the .cache folder to resolve any weird issues around caching
  if (options.profile !== 'safe' && process.env.INIT_CWD && (options.features.cacheLoader || options.features.hardSourcePlugin)) {
    const cacheFolder = resolve('./node_modules/.cache')
    if (existsSync(cacheFolder))
      rimrafSync(cacheFolder)
  }
  const defaults = {
    outputFormat: 'human',
  }
  const measureOptions = {
    ...defaults,
    ...(typeof options.measure === 'boolean' ? {} : options.measure),
  } as SpeedMeasurePlugin.Options
  const smp = new SpeedMeasurePlugin(measureOptions)
  nuxt.hook('webpack:config', (configs: WebpackConfiguration[]) => {
    configs.forEach((config) => {
      if (config.name === options.measureMode || options.measureMode === 'all') {
        // @ts-ignore
        smp.wrap(config)
        logger.info(`SpeedMeasurePlugin is enabled for \`${config.name}\`. Build time may be effected.`)
      }
    })
  })
}
