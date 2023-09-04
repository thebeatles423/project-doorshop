const log = require('./log.js').log;
const fs = require('fs-extra');
const settings = require("./settings.json");
const io = require('./index.js').io;

let bans = {};

exports.init = function() {
    fs.ensureFile("./bans.json")
        .then(() => {
            console.log("Created empty bans list.");
            bans = require("./bans.json");
        })
        .catch((err) => {
            throw "Could not load bans.json. Check syntax and permissions.";
        });
};

exports.saveBans = function() {
    fs.writeJson("./bans.json", bans)
        .then(() => {
            log.info.log('info', 'banSave', { error: null });
        })
        .catch((error) => {
            log.info.log('info', 'banSave', { error });
        });
};

// Ban length is in minutes
exports.addBan = function(ip, length, reason) {
    length = parseFloat(length) || settings.banLength;
    reason = reason || "N/A";
    bans[ip] = {
        reason,
        end: new Date().getTime() + length * 60000,
    };

    const sockets = io.sockets.sockets;
    const socketList = Object.keys(sockets);

    for (const socketId of socketList) {
        const socket = sockets[socketId];
        if (socket.request.connection.remoteAddress === ip) {
            exports.handleBan(socket);
        }
    }

    exports.saveBans();
};

exports.removeBan = function(ip) {
    delete bans[ip];
    exports.saveBans();
};

exports.handleBan = function(socket) {
    const ip = socket.request.connection.remoteAddress;

    if (bans[ip] && bans[ip].end <= new Date().getTime()) {
        exports.removeBan(ip);
        return false;
    }

    log.access.log('info', 'ban', { ip });
    socket.emit('ban', {
        reason: bans[ip].reason,
        end: bans[ip].end,
    });
    socket.disconnect();
    return true;
};

exports.kick = function(ip, reason) {
    const sockets = io.sockets.sockets;
    const socketList = Object.keys(sockets);

    for (const socketId of socketList) {
        const socket = sockets[socketId];
        if (socket.request.connection.remoteAddress === ip) {
            socket.emit('kick', { reason: reason || "N/A" });
            socket.disconnect();
        }
    }
};

exports.isBanned = function(ip) {
    return bans.hasOwnProperty(ip);
};
