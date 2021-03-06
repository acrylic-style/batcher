#!/usr/bin/env node

require('./src/yaml')
const cwd = require('path').resolve('.')
process.chdir(__dirname)
const { LoggerFactory } = require('logger.js')
const logger = LoggerFactory.getLogger('main', 'blue')
const $ = `${require('os').homedir()}/.batcher`
const cp = require('child_process')
const _fs = require('fs')
if (!_fs.existsSync($)) _fs.mkdirSync($)
if (!_fs.existsSync(`${$}/batches`)) _fs.mkdirSync(`${$}/batches`)
const fs = _fs.promises
if (process.argv.includes('--debug')) {
  logger.config(true)
  logger.debug('You have turned on the debug logging.')
  delete process.argv[process.argv.indexOf('--debug')]
  process.argv = process.argv.filter(e => e !== undefined && e !== null)
}
logger.debug(`Application directory (configuration): ${cwd}`)
logger.debug(`Application location: ${__dirname}`)
const args = process.argv.slice(2)
const run = args[0]
const taskName = args[1]
const arguments = args.slice(2)
!(async () => {
  logger.debug(`Scanning ${$}/batches`)
  const files = (await fs.readdir(`${$}/batches`)).filter(s => s.endsWith('.yml')).map(s => s.replace(/(.*)\.yml/, "$1"))
  logger.debug(`Found ${files.length} parsable files`)
  if (files.length === 0) {
    logger.error('Found no parsable files! Please create the batch file with the instruction at batches/README.md.')
    logger.error(`The batches directory is located at: ${$}/batches`)
    return
  }
  if (run === undefined) {
    logger.info('You must specify which task to run.')
    logger.info('Available tasks are:')
    files.forEach(s => {
      logger.info(` - ${s}`)
    })
    return
  }
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
  if (target.tasks === undefined) {
    logger.warn('No runnable task found.')
    return
  }
  const task = target.tasks[taskName]
  if (task === undefined) return logger.warn(`Task '${taskName}' could not be found on '${run}' [${target.name}].`)
  if (task.run === undefined || task.run.length === 0) return logger.warn(`Task '${taskName}' doesn't have any runnable command.`)
  logger.info(`Running task: ${taskName} [${task.name}] in ${run} [${target.name}]`).info(`${task.run.length} command(s) will be run.`)
  const finalCwd = task.cwd || cwd
  let p = 0
  const next = () => {
    if (p === task.run.length) return
    let cmd = task.run[p]
    const suppressLog = cmd.startsWith('@')
    const suppressOutput = cmd.startsWith('@@')
    if (suppressLog) cmd = cmd.replace(/^@{1,2}(.*)/, '$1')
    const say = cmd.startsWith('say')
    if (say) cmd = cmd.replace(/say (.*)/, 'echo $1')
    cmd = cmd.replace('$*', arguments.join(' '))
    arguments.forEach((a, i) => cmd = cmd.replace(`\$${i}`, a))
    logger[suppressLog ? 'debug' : 'info'](`> ${cmd}`)
    const s = cp.spawn(cmd, { cwd: finalCwd, windowsHide: true, encoding: 'utf-8', shell: true })
    if (!suppressOutput) {
      s.stdout.on('data', data => {
        const m = data.toString().replace(/(.*)\n/, '$1')
        if (say) {
          logger.info(m)
        } else {
          console.log(m)
        }
      })
      s.stderr.on('data', data => {
        const m = data.toString().replace(/(.*)\n/, '$1')
        if (say) {
          logger.info(m)
        } else {
          console.log(m)
        }
      })
    }
    s.once('exit', () => {
      next()
    })
    p++
  }
  next()
})()
