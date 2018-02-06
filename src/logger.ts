import * as FS from 'fs-extra'
import * as path from 'path'
import StripAnsi = require('strip-ansi')

const timestamp = () => new Date().toISOString()
const wait = (ms: number) => new Promise(resolve => setTimeout(() => resolve(), ms).unref())

function chomp(s: string): string {
  if (s.endsWith('\n')) return s.replace(/\n$/, '')
  return s
}

export class Logger {
  protected flushing: Promise<void> = Promise.resolve()
  protected buffer: string[] = []

  constructor(public file: string) {}

  log(msg: string) {
    let stripAnsi: typeof StripAnsi = require('strip-ansi')
    msg = stripAnsi(chomp(msg))
    let lines = msg.split('\n').map(l => `${timestamp()} ${l}`.trimRight())
    this.buffer.push(...lines)
    this.flush(50).catch(console.error)
  }

  async flush(waitForMs: number = 0) {
    await wait(waitForMs)
    this.flushing = this.flushing.then(async () => {
      if (this.buffer.length === 0) return
      const mylines = this.buffer
      this.buffer = []
      const fs: typeof FS = require('fs-extra')
      await fs.mkdirp(path.dirname(this.file))
      await fs.appendFile(this.file, mylines.join('\n') + '\n')
    })
    await this.flushing
  }
}
