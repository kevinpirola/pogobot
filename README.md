# PogoBot

[NOTE] This is likely to be not legal for Niantic and might led your account to a ban. Use at your own risk. The team can't be responsible for your loss. Doing anything of the following guide state that you agree with this. Every information (username or password) will not be stored anywhere in our systems.

## Introduction
I am a pokémon fan, I am a Pokémon Go player, I am a software developer, I am an open source fan.
The aim of this project is to create something that can be used by Pokémon Go player in order to improve their game experience.
Of course the final goal is to be the definitive Bot, in a first moment it will be just a bunch of useful tools.
### Why a bot
I hate cheaters but there will be days during which new player will have a hard life against capped top players all around. Is this an excuse? Maybe it is, the main point is that we might be able to create a bot, and it's the challenge that we like. Nothing else. For real.
### Using a bot
If you are asking us if we have ever used a bot the answer is no. What's the point in using a bot, when each and every other player that see a 30+ level trainer know that is a bot?
You can't show them 'your' pokemons. Of course they know you didn't catch them.
You can't show them 'your' level. Of course they know that is the result of a bot being online 24/7.
You can't show them 'your' pokedex. Everyone is able to catch an african-only Kangaskan while being on his sofa.

The problem is that someone do.

And the only way to beat a Bot is to use a Bot (if for some strange reason you would like to beat it).

Please, remember, if you use a bot that is unfair. Someone on his bike on top of a mountain far away in the desert at 40° will be quite upset if you steal his emptied gym - if you're not beside him.

That is one of the worst feeling, and of course will earn you a direct report to Niantic.

Don't be smartass. Play fair, or instead play LOL, there you can Bot as much as you can, as I don't play.
### For the sake of "I CAN"
I will never be done in saying that this project is *not* created just to allow strangers to cheat at the game.
I am developing this just because I think I can. And for me it's enough. There will be instruction, detailed wiki and so on. But I will never help anybody. If you want to cheat you should have enough knowledge to cheat.

##The team
At the moment the team is composed by myself, but I'm working side by side with my friend Alberto. I hope his back pain will relieve soon so that he will be able to help me.

##Technologies
Here there will be listed all the technologies used to create the bot.

##Features
###IV calculator
The IV calculator is a tool that can read the list of all your pokemon from your account and return a single precise IV value for each of them. The tool features will be:

 * Fetch the list of pokemons from an account (PTC and Google)
 * Calculate the IV (attack, defense and stamina) for each pokemon
 * Store the data in the DB for offline browsing
 * Order the result by id, name, CP or IV
 * ......more to come......

##Installation and run
To run the application on your laptop there are a variety of pre-requisite that you need to fulfill.
###Operative System
This guide is intended for OSX users (Apple) or Linux users (teste on Ubuntu14 and Centos7). Sorry windows users, your days are over, you will need to figure yourself how to deal with this configuration.
###GIT
The project is of course on GitHub, so you will need to install Git on your machine.
Apple users will thank Steve, for the Mac is shipped with Git pre-installed.
In linux you can use apt-get (or yum or similar) like this:
```sudo apt-get install git```

Once Git is installed, running this:
```
git --version
```
will return something like:
```
git version 1.8.3.1
```
###NodeJS
The project is developed in javascript and uses the framework nodejs both to run the code and to manage dependencies (with node package manager - npm).
To install node run this:
```
sudo apt-get install nodejs
sudo apt-get install npm
```
and if you run `node -v && npm -v` you should get something like:
```
v4.4.7
2.15.8
```

for MacOSX users you can follow one of the hundreds of guide available in the net like this: [Guide](http://blog.teamtreehouse.com/install-node-js-npm-mac) or just go to the official site [NodeJS](http://www.nodejs.org) and install it with the installer.
###Downloading the code
Now you are ready to start, you will need to copy the project in your machine.
Open a terminal, navigate to the folder that you like the project to be in (use `cd` to change dirs, `mkdir` to create new folders).In my case I will put the project inside my Documents folder like this:
```
cd ~/Documents
```
Then, to clone the repository run:
```
git clone https://github.com/kevinpirola/pogobot.git
```
and wait the end.
Once finished git should have added a folder called `pogobot/` inside your starting folder. To check just list the files with `ls`.

The project is changing hours by ours, to keep your code up-to-date just run:
```
git pull origin master
```

In future I will add different branches and tagged releases.
###Installing the dependencies
When you have cloned the repository navigate to the root folder (for example `cd ~/Documents/pogobot/`) and run:
```
npm install
```

###Run
To run the IV calculator you have to type:
```
node runbot.js -u yourUsername -p yourPassword
```

You can also use various dependencies like:
 * `-a` to specify the login method (it can be either ptc or google)
 * `-o` to specify how you want the list of pokemon to be ordered (ab: alphabetically, IV: by IV, cp: by CP, name)

To save the output in a file just add `> filename.txt` to the command.
