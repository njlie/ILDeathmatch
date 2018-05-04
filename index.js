const { spawn } = require('child_process')
const fetch = require('node-fetch')
const config = require('./config.json')
var StreamSplitter = require('stream-splitter')
const WebSocket = require('ws')
const jwt = require('jsonwebtoken')
const quake = spawn('node', ['build/ioq3ded.js', '+set', 'fs_game', 'baseq3', '+set', 'dedicated', '1', '+exec', 'server.cfg'])
var cmdArray = []
var prevToken = ''
var playerList = {}

const ws = new WebSocket(`ws://${config.baseUrl}/server`)

function makeJWT () {
  const payload = {
    'source': 'ILDM'
  }

  const token = jwt.sign(payload, config.secret, {
    algorithm: 'HS256',
    expiresIn: 3600,
    issuer: 'ILDeathmatch'
  })

  return token
}

ws.on('open', function open () {
  ws.send('server ws connected.')
})

ws.on('message', (message) => {
  console.log(message)
  const parse = JSON.parse(message)
  const msg = parse.msg || ''
  if (msg.includes('--ILDM_CONNECT_CLIENT')) {
    playerList[parse.index] = parse.id
    fetch(`http://${config.baseUrl}/game/spawn/` + parse.id, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jwt: makeJWT() })
    }).then(res => {
      console.log(res.status)
      if (res.status !== 200) {
        console.log('kick player for having no balance/pointer')
        const kickPlayer = 'kick ' + parse.index + '\n'
        quake.stdin.write(kickPlayer)
      }
    })
  }
})

var quakeErr = quake.stderr.pipe(StreamSplitter('\n'))
quakeErr.encoding = 'utf-8'
quakeErr.on('token', token => {
  console.log('TOKEN: ', token)

  if (token.includes('ClientBegin:')) {
    const client = token.split(':').map(e => e.trim())[1]
    const dumpuser = 'dumpuser ' + client + '\n'
    const telluser = 'tell ' + client + ' --ILDM_CONNECT ' + client + '\n'
    // cmdArray.push({ name: 'ip', index: client })
    // quake.stdin.write(dumpuser)
    quake.stdin.write(telluser)
  }

  if (token.includes('ClientDisconnect:')) {
    const client = token.split(':').map(e => e.trim())[1]
    console.log('Disconnected: ', playerList[client])
    fetch(`http://${config.baseUrl}/game/disconnect/` + playerList[client], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({jwt: makeJWT()})
    })
    delete playerList[client]
  }

  if (token.includes('Kill:')) {
    const players = token.split(' ').map(e => e.trim())
    const killer = players[1]
    const killed = players[2]
    console.log(`Player ${killer} killed Player ${killed}`)
    if (killer !== '1022' && killer !== killed) {
      // cmdArray.push({ name: 'killer' })
      fetch(`http://${config.baseUrl}/game/kill/` + playerList[killer], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({jwt: makeJWT()})
      }).then(res => {
        console.log(res.status)
        console.log(res)
      })
    }
    // cmdArray.push({ name: 'killed', index: killed })
    // const dumpKiller = 'dumpuser ' + killer + '\n'
    // const dumpKilled = 'dumpuser ' + killed + '\n'
    // quake.stdin.write(dumpKiller)
    // quake.stdin.write(dumpKilled)

    fetch(`http://${config.baseUrl}/game/killed/` + playerList[killed], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({jwt: makeJWT()})
    }).then(res => {
      console.log(res.status)
      console.log(res)
      if (res.status !== 200) {
        console.log('kick player for having no balance/pointer')
        const kickPlayer = 'kick ' + killed + '\n'
        quake.stdin.write(kickPlayer)
      }
    })
  }

  if (token.includes('ip        ') && prevToken === '--------') {
    console.log('IP TOKEN: ', token)
    const ip = token.split('ip').map(e => e.trim())[1].replace(/\./g, '-')
    const action = cmdArray.shift()
    console.log('ACTION: ', action)
    if (action.name === 'ip') {
      console.log('Got IP: ', ip)
      // playerList[action.index] = ip
      fetch(`http://${config.baseUrl}/game/spawn/` + ip, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({jwt: makeJWT()})
      }).then(res => {
        console.log(res.status)
        if (res.status !== 200) {
          console.log('kick player for having no balance/pointer')
          const kickPlayer = 'kick ' + action.index + '\n'
          quake.stdin.write(kickPlayer)
        }
      })
    } else if (action.name === 'killer') {
      console.log('Kill by ', ip)
      fetch(`http://${config.baseUrl}/game/kill/` + ip).then(res => {
        console.log(res.status)
        console.log(res)
      })
    } else if (action.name === 'killed') {
      console.log('Was killed: ', ip)
      fetch(`http://${config.baseUrl}/game/killed/` + ip).then(res => {
        console.log(res.status)
        console.log(res)
        if (res.status !== 200) {
          console.log('kick player for having no balance/pointer')
          const kickPlayer = 'kick ' + action.index + '\n'
          quake.stdin.write(kickPlayer)
        }
      })
    }
  }

  prevToken = token
})
