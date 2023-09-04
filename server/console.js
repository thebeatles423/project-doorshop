const Ban = require('./ban.js');

const commands = {
    ban: {
        help: 'ip [length reason]',
        function: function(args) {
            if (args.length === 0) {
                return console.log(this.help);
            }

            const [ip, length, reason] = args;
            Ban.addBan(ip, length, reason);
            console.log(`ban: ${ip},${length},${reason}`);
        },
    },
    kick: {
        help: 'ip [reason]',
        function: function(args) {
            if (args.length === 0) {
                return console.log(this.help);
            }

            const [ip, ...reason] = args;
            const reasonText = reason.join(' ').trim() || undefined;

            Ban.kick(ip, reasonText);
            console.log(`kick: ${ip},${reasonText}`);
        },
    },
    unban: {
        help: 'ip',
        function: function(args) {
            if (args.length === 0) {
                return console.log(this.help);
            }

            const ip = args[0];
            Ban.removeBan(ip);
            console.log(`unban: ${ip}`);
        },
    },
    help: {
        function: function() {
            const keys = Object.keys(commands);
            for (const key of keys) {
                console.log(`${key}:\t${commands[key].help || 'N/A'}`);
            }
        },
    },
};

exports.listen = function() {
    process.openStdin().addListener('data', function(input) {
        try {
            const inputString = input.toString().trim();
            const [command, ...args] = inputString.split(' ');
            const argsString = args.join(' ');
            
            if (commands[command]) {
                commands[command].function(args);
            } else {
                console.log('Invalid command.');
            }
        } catch (e) {
            console.log('Error:', e.message);
        }
    });
};
