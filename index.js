const { Client } = require("discord.js-selfbot-v13");
const Discord = require("discord.js-selfbot-v13");
const client = new Client({
  checkUpdate: false,
}); // All partials are loaded automatically

const config = require("./config.js");

const db = require("old-wio.db");

db.backup("backup.json");

var moment = require("moment");
moment.suppressDeprecationWarnings = true;

const express = require("express");
const app = express();

app.get("/", function (req, res) {
  res.send("why tf you here?");
});

app.listen(3000);

client.on("ready", async () => {
  console.log(`${client.user.tag} is ready!`);

  client.user.setStatus(config.presence.status);

  const r = new Discord.CustomStatus()
    .setState(config.presence.customStatus)
    .setEmoji(config.presence.emoji);
  client.user.setActivity(r.toJSON());
});

const userId = config.userID;

client.on("ready", () => {
  setInterval(() => {
    const presenceChannel = client.channels.cache.get(config.channelID);

    const presenceUser = client.users.cache.get(userId);

    const guild = client.guilds.cache.get(config.serverID);

    const member = guild.members.cache.get(userId);

    // Device

    let devices = [];

    if (member.presence) {
      var status = member.presence.clientStatus;
    }

    if (status) {
      if (status.desktop) {
        devices.push("`Desktop`");
      }

      if (status.web) {
        devices.push("`Web`");
      }

      if (status.mobile) {
        devices.push("`Mobile`");
      }
    }

    devices = devices.join(", ") || "None";

    if (db.has(`${presenceUser.id}-device`)) {
      oldDevices = db.fetch(`${presenceUser.id}-device`);
    } else {
      oldDevices = "Unknown";
    }

    db.set(`${presenceUser.id}-device`, devices);

    if (oldDevices != devices) {
      presenceChannel.messages.fetch({ limit: 1 }).then((messages) => {
        let lastMessage = messages.first();

        if (!lastMessage) return;

        let lastMsgContent = lastMessage.content;

        var updatedDevice = lastMsgContent.replace(
          /on .*!/,
          "on " + devices + "!"
        );
        lastMessage.edit(updatedDevice);
      });
    }

    if (!member.presence) {
      Presence = "offline";
    } else {
      Presence = member.presence.status;
    }

    if (db.has(`${presenceUser.id}-presence`)) {
      oldPresence = db.fetch(`${presenceUser.id}-presence`);
    } else {
      oldPresence = "Unknown";
    }

    db.set(`${presenceUser.id}-presence`, Presence);

    if (oldPresence == Presence) return;

    if (db.has(`${presenceUser.id}-last_seen`)) {
      then_d = db.fetch(`${presenceUser.id}-last_seen`);
    } else {
      then_d = "Unknown";
    }

    var then = moment(then_d);

    var now_d = new Date().toISOString();

    var now = moment(new Date());

    db.set(`${presenceUser.id}-last_seen`, now_d);

    const duration = moment.duration(now.diff(then));
    const hours = parseInt(duration.asHours());
    const minutes = parseInt(duration.asMinutes()) % 60;
    const seconds = parseInt(duration.asSeconds()) % 60;

    //\n${presenceUser.tag} was \`${oldPresence}\` for ${presenceDuration}

    const presenceDuration = `\n${presenceUser.tag} was \`${oldPresence}\` for **\`${hours}\` hour(s)**, **\`${minutes}\` minute(s)**, **\`${seconds}\` second(s)**\n‎ `;

    const time = parseInt((new Date().getTime() / 1000).toFixed(0));

    /* Old Presence */

    presenceChannel.messages.fetch({ limit: 1 }).then((messages) => {
      let lastMessage = messages.first();

      if (!lastMessage) return;

      const content = lastMessage.content;

      const contentModified = content.replace("is", "was");

      lastMessage.edit(contentModified + presenceDuration);
    });

    if (Presence == "online") {
      presenceChannel.send(
        `‎ \n${config.emojis.online} ∙ **${presenceUser.tag}** is **\`online\`** on ${devices}!\n\n<t:${time}:F> [ <t:${time}:R> ]\n‎ `
      );
    }
    if (Presence == "idle") {
      presenceChannel.send(
        `‎ \n${config.emojis.idle} ∙ **${presenceUser.tag}** is **\`idle\`** on ${devices}!\n\n<t:${time}:F> [ <t:${time}:R> ]\n‎ `
      );
    }
    if (Presence == "dnd") {
      presenceChannel.send(
        `‎ \n${config.emojis.dnd} ∙ **${presenceUser.tag}** is **\`dnd\`** on ${devices}!\n\n<t:${time}:F> [ <t:${time}:R> ]\n‎ `
      );
    }
    if (Presence == "offline") {
      presenceChannel.send(
        `‎ \n${config.emojis.offline} ∙ **${presenceUser.tag}** is **\`offline\`**!\n\n<t:${time}:F> [ <t:${time}:R> ]\n‎ `
      );
    }
    console.log(
      `\n${presenceUser.tag} is now ${Presence} - ${new Date().toLocaleString(
        "en-US"
      )}`
    );
  }, 3000);
});

client.login(config.token);
