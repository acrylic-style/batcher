require('./src/yaml')
const { LoggerFactory } = require('logger.js')
const logger = LoggerFactory.getLogger('main', 'blue')
const $ = __dirname
const cp = require('child_process')
const _fs = require('fs')
const fs = _fs.promises
if (process.argv.includes('--debug')) {
  logger.config(true)
  logger.debug('You have turned on the debug logging.')
  delete process.argv[process.argv.indexOf('--debug')]
}
const args = process.argv.slice(2)
const run = args[0]
const taskName = args[1]
const arguments = args.slice(2)
!(async () => {
  logger.debug('Loading batches...')
  const files = (await fs.readdir(`${$}/batches`)).filter(s => s.endsWith('.yml')).map(s => s.replace(/(.*)\.yml/, "$1"))
  logger.debug(`Found ${files.length} parsable files`)
  if (files.length === 0) return logger.error('Found no parsable files! Please create the batch file with the instruction at batches/README.md.')
  const files2 = files.filter(s => s.toLowerCase() === run.toLowerCase())
  if (files2.length === 0) return logger.error('You must specify valid batch.')
  const filename = files2[0]
  const path = `${$}/batches/${filename}`
  logger.debug(`Loading ${path}...`)
  const target = require(path)
  logger.debug(`Successfully loaded ${path}`)
  if (taskName === undefined) {
    logger.info(`----- Batch information: ${target.name} -----`)
    logger.info(`Description: ${target.description}`)
    if (target.tasks === undefined || Object.keys(target.tasks).length === 0) return logger.warn('No runnable task found.')
    Object.keys(target.tasks).forEach(k => {
      const task = target.tasks[k]
      logger.info(` - ${k}`)
        .info(`         Name : ${task.name}`)
        .info(`  Description : ${task.description}`)
        .info(`        Usage : ${task.usage}`)
    })
    return
  }
  const task = target.tasks[taskName]
  if (task === undefined) return logger.warn(`Task '${taskName}' could not be found on '${run}' [${target.name}].`)
  logger.info(`Running task: ${taskName} [${task.name}] in ${run} [${target.name}]`).info(`${task.run.length} command(s) will be run.`)
  task.run.forEach(cmd => {
    cp.execSync(cmd, { cwd: '.', windowsHide: true, encoding: 'utf-8' })
  })
})()
