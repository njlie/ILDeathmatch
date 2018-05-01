const { spawn } = require('child_process')
const fetch = require('node-fetch')
const config = require('./config.json')
var StreamSplitter = require('stream-splitter')
const WebSocket = require('ws')
const quake = spawn('node', ['build/ioq3ded.js', '+set', 'fs_game', 'baseq3', '+set', 'dedicated', '2', '+exec', 'server.cfg'])
var cmdArray = []
var prevToken = ''
var playerList = {}

const ws = new WebSocket(`ws://${config.baseUrl}/server`)

ws.on('open', function open() {
  ws.send('server ws connected.')
})

ws.on('message', (message) => {
  console.log(message)
})

var test = quake.stderr.pipe(StreamSplitter('\n'))
test.encoding = 'utf-8'
test.on('token', token => {
  console.log('TOKEN: ', token)

  if (token.includes('ClientBegin:')) {
    const client = token.split(':').map(e => e.trim())[1]
    const dumpuser = 'dumpuser ' + client + '\n'
    cmdArray.push({ name: 'ip', index: client })
    quake.stdin.write(dumpuser)
  }

  if (token.includes('ClientDisconnect:')) {
    const client = token.split(':').map(e => e.trim())[1]
    const dumpuser = 'dumpuser ' + client + '\n'
    console.log('Disconnected: ', playerList[client])
    fetch(`http://${config.baseUrl}/game/disconnect/` + playerList[client])
    delete playerList[client]
  }

  if (token.includes('Kill:')) {
    const players = token.split(' ').map(e => e.trim())
    const killer = players[1]
    const killed = players[2]
    console.log(`Player ${killer} killed Player ${killed}`)
    cmdArray.push({ name: 'killer' })
    cmdArray.push({ name: 'killed', index: killed })
    const dumpKiller = 'dumpuser ' + killer + '\n'
    const dumpKilled = 'dumpuser ' + killed + '\n'
    quake.stdin.write(dumpKiller)
    quake.stdin.write(dumpKilled)
  }

  if (token.includes('ip        ') && prevToken === '--------') {
    console.log('IP TOKEN: ', token)
    const ip = token.split('ip').map(e => e.trim())[1].replace(/\./g, '-')
    const action = cmdArray.shift()
    console.log('ACTION: ', action)
    if (action.name === 'ip') {
      console.log('Got IP: ', ip)
      playerList[action.index] = ip
      fetch(`http://${config.baseUrl}/game/spawn/` + ip).then(res => {
        console.log(res.body)
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
