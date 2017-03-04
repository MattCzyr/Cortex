const Discord = require("discord.js");
const client = new Discord.Client();

const Cleverbot = require("cleverbot-node");
const bot = new Cleverbot;

const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

const fs = require("fs");

const greetings = ["Hi there!", "Hello!", "How's it going?", "What's up?"];

var filename = process.argv[2];
if (filename.indexOf('.') < 0) {
    filename += ".txt";
}

var active = false;

bot.configure({
    botapi: 'cortex-discord'
});

Cleverbot.prepare(function() {
    console.log("Logged into Cleverbot using the API key cortex-discord.");
});

function getNickname(guild) {
    if (guild.available) {
        var member = guild.members.get(client.user.id);
        if (member != null && member.nickname != null) {
            return member.nickname;
        }
    }

    return client.user.username;
}

function log(message, guild, channel) {
    var data = "<" + getNickname(guild) + ">" + " " + message + "\n";

    var path = "logs/";
    if (guild.available) {
        path += guild.name + "/" + channel.name + ".log";
    } else {
        path += "default.log";
    }

    mkdirp(getDirName(path));

    fs.appendFile(path, data, function(err) {
        if (err) return console.log(err);
    });
}

client.on('ready', () => {
    client.user.setGame('//help');
});

client.on('message', msg => {
    if (msg.content.startsWith("//help")) {
        msg.reply("`//help` Displays command info.\n`//start <users>` Starts a conversation with the mentioned users.\n`/stop` Stops any conversations taking place between bots.");
    } else if (msg.content.startsWith("//start") && !active && msg.channel.permissionsFor(msg.author).hasPermission("ADMINISTRATOR")) {
        var userMentions = msg.mentions.users.array();
        if (userMentions.length > 1) {
            if (userMentions[0] === client.user) {
                var mentions = "";
                var users = "";
                for (var i = 1; i < userMentions.length; i++) {
                    mentions += "<@" + userMentions[i].id + "> ";
                    if (userMentions[i] !== client.user) {
                        if (i > 1) {
                            users += ", ";
                        }
                        users += userMentions[i].username;
                    }
                }

                client.user.setGame('with ' + users);
                var greeting = greetings[Math.floor(Math.random() * greetings.length)];
                msg.channel.sendMessage(mentions + greeting);
                log(greeting, msg.guild, msg.channel);
            } else {
                var users = userMentions[0].username;
                for (var i = 1; i < userMentions.length; i++) {
                    if (userMentions[i] !== client.user) {
                        if (i > 1) {
                            users += ", ";
                        }
                        users += userMentions[i].username;
                    }
                }
                client.user.setGame('with ' + users);
            }
            active = true;
        } else {
            msg.reply("Usage: `//start <users>`");
        }
    } else if (msg.content.startsWith("//stop") && msg.channel.permissionsFor(msg.author).hasPermission("ADMINISTRATOR")) {
        active = false;
        client.user.setGame('//start');
    } else if (msg.isMentioned(client.user) && ((active && msg.author.bot) || !msg.author.bot)) {
        msg.channel.startTyping();
        var query = msg.content.trim()
        if (query.startsWith("<")) {
            var index = query.indexOf('>');
            if (query.charAt(index + 1) == ',') {
                index++;
            }
            query = query.substring(index + 1).trim();
        }
        bot.write(query, function(response) {
            msg.reply(response.message);

            log(response.message, msg.guild, msg.channel);
        });
        msg.channel.stopTyping(true);
    }
});

if (process.argv.length < 3) {
    console.log("Must provide a token.");
    process.exit(1);
}

fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    client.login(data);
});
