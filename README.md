# c9dash
Dashboard for launching cloud 9 servers.

- ##### [Setup](#setup)

## Pre-Reqs

 - nodejs
 - npm


## Setup / Running

1. Copy the contents of this repo to a new directory on your computer.
 - Do one of the following:
   - Download the zip from the green dropdown above
   - Clone via command line `git clone https://github.com/MatthewMerrill/c9dash.git`

2. `npm run install_script`

3. `node index.js [args]`

## Args

Argument priority is:

1. Command line arguments
2. Environment variables
3. Defaults

Example: `node index.js --http:port=8080`

###### http:port (Optional)
 - Port to listen on for the main dashbaord.
 - Default: `3000`

###### config:db (Optional)
 - Path to database keeping track of projects.
 - Default: `db.json`

###### config:auth (Optional)
 - Path to database storing the username and password.
 - Default: `auth.json`
