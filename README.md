# enclosure.io

## Deployment Guide

### Dependencies:
- NodeJS 6.x
- NPM

### Install Packages & Run:
- `npm install` to install required packages (root privilege may be required)
- `npm start` to start the server & listening on port 3000

## Documentation

Members: Hailiang Xu (hailianx), Chunan Zeng (chunanz), Leiyu Zhao (leiyuz)

### Description

We would like to build an online multi-player game similar to [paper-io.com](http://www.paper-io.com). Basically, each player can move up, down, left and right on a canvas. Once the route of the movement encloses, it area inside the route is assigned to the player. The process is called "enclosure". A player can either enclose empty areas or other players' places. The score is determined by the percentage of a player's enclosed area to the total area of the canvas.

There are 3 ways a player can go die:

1. The unenclosed route is touch by any player, including the owner.
2. Two players collide with each other.
3. The player touches any wall.

### New Features

We want to extend the original game with features we like:

- Player accounts that records historical rankings
- Players can choose specific rooms to play with friends
- Players can play in teams
- Different maps with different patterns of walls
- Special items that can change attributes of some players
- Multiple playing modes: survival or timed
- Players can enter observe mode to watch other players playing

### Technical Stack

- Frontend:
  - jQuery + H5: convinient yet powerful frontend technologies


- Backend:
  - Node.js + express.io: lightweight, shared memory model, easy to implement
  - nginx: reliable listener for port 80


- Frontend-backend communication:
  - Websocket: full duplex communication
- Database:
  - MongoDB: NoSQL, easy to store unstructured data, like map information.
