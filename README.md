# ILDeathmatch

ILDeathmatch is a version of Quake III Arena that has been retrofitted with [Web Monetization](https://interledger.org/rfcs/0028-web-monetization/) in order to allow players to receive money in the form of XRP. ILDeathmatch changes basic Quake III gameplay in two ways: 
- Spawning requires payment.
- Each kill pays the player that made said kill.

With Web Monetization, ILDeathmatch is able to compensate each kill in real time.
ILDeathmatch uses the binary from [inolen/quakejs](https://github.com/inolen/quakejs) with middleware from the [dm-web-monetization module](https://github.com/njlie/dm-web-monetization) for payments.

## Running ILDeathmatch

This tutorial is based on the one found at [inolen/quakejs](https://github.com/inolen/quakejs#baseq3-server-step-by-step).

### Prerequisites

- A Quake III Arena server running the baseq3 gamemode (This repository)
- A Web Monetization Server to manage payments between the server and its clients ([ILDeathmatch-Server](https://github.com/njlie/ILDeathmatch-Server))

First, make sure you are running an instance of [ILDeathmatch-Server](https://github.com/njlie/ILDeathmatch-Server). ILDeathmatch will make API calls to this server to issue charges and payments.

Next, execute the following commands in the root directory:

```
npm install
node build/ioq3ded.js +set fs_game baseq3 +set dedicated 2
```

At this point, you should see an EULA for Quake III appear in the terminal. Keep pressing Enter until you have read through the EULA, then answer the `Agree? (y/n)` prompt. Then the base game files will download. Once this finishes, press Ctrl+C to quit the server.

Navigate to the newly created `base/baseq3` directory and create a file with the name `server.cfg` and add the following to it:
```
seta sv_hostname "CHANGE ME"
seta sv_maxclients 12
seta g_motd "CHANGE ME"
seta g_quadfactor 3
seta g_gametype 0
seta timelimit 15
seta fraglimit 25
seta g_weaponrespawn 3
seta g_inactivity 3000
seta g_forcerespawn 0
seta rconpassword "CHANGE_ME"
set d1 "map q3dm7 ; set nextmap vstr d2"
set d2 "map q3dm17 ; set nextmap vstr d1"
vstr d1
```
Replace the fields containing `CHANGE_ME` with whatever you wish, as well as modifying any other settings you wish to change.
A good reference can be found at [Quake 3 World](https://www.quake3world.com/q3guide/servers.html).

Now your server can be run with the following command:
```
node build/ioq3ded.js +set fs_game baseq3 +set dedicated 2 +exec server.cfg
```
If you did everything right, you should be able to connect to the Quake server using the ILDeathmatch Server on localhost at http://localhost:8080/play?connect%20localhost:27960. Note that Quake servers always listen on port 27960, but you can replace localhost with whatever IP you are using to host the server.
