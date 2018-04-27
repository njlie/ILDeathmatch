const { spawn } = require('child_process')
var StreamSplitter = require('stream-splitter')
const quake = spawn('node', ['build/ioq3ded.js', '+set', 'fs_game', 'baseq3', '+set', 'dedicated', '2', '+exec', 'server.cfg'])
var cmdArray = []

var test = quake.stderr.pipe(StreamSplitter('\n'))
test.encoding = 'utf-8'
test.on('token', token => {
  console.log('TOKEN: ', token)

  if (token.includes('ClientBegin:')) {
    const client = token.split(':').map(e => e.trim())[1]
    const dumpuser = 'dumpuser ' + client + '\n'
    cmdArray.push('ip')
    cmdArray.push('connect')
    quake.stdin.write(dumpuser)
  }

  if (token.includes('ClientDisconnect:')) {
    const client = token.split(':').map(e => e.trim())[1]
    const dumpuser = 'dumpuser ' + client + '\n'
    cmdArray.push('disconnect')
    quake.stdin.write(dumpuser)
  }

  if (token.includes('Kill:')) {
    const players = token.split(' ').map(e => e.trim())
    const killer = players[1]
    const killed = players[2]
    console.log(`Player ${killer} killed Player ${killed}`)
    cmdArray.push('killer')
    cmdArray.push('killed')
    const dumpKiller = 'dumpuser ' + killer + '\n'
    const dumpKilled = 'dumpuser ' + killed + '\n'
    quake.stdin.write(dumpKiller)
    quake.stdin.write(dumpKilled)
  }

  if (token.includes('ip        ')) {
    console.log('IP TOKEN: ', token)
  }

  if (token.includes('cl_guid')) {
    const guid = token.split(' ').map(e => e.trim()).filter(e => e !== '')[1]
    const action = cmdArray.shift()
    switch (action) {
      case 'connect': {
        console.log(`Payment pointer is $${guid}.com`)
        // TODO: API call to add someone to web monetization server - use IP against websockets
        break
      }
      case 'killer': {
        console.log(`Player ${guid} got a kill and is to be rewarded.`)
        // TODO: API call to pay player.
        break
      }
      case 'killed': {
        console.log(`Player ${guid} got killed and will be punished.`)
        // TODO: API call to charge player.
        break
      }
      case 'disconnect': {
        console.log(`Player ${guid} disconnected. Deducting balance.`)
        // TODO: Should deduction occur here or on join?
        break
      }
      default: {
        break
      }
    }
  }
})