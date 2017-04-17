module.exports={
    // `game` describe attributes about a game and will be transmitted to client
    // before connecting to server.
    game: {
        FPS:        40,
        RPS:        6,
        RPSLag:     1,      // the lag between client and server, typically the slowest speed

        defaultMap: {
            MapSize:        [80, 80], // default map size
            MaxPlayer:      20,
            map: require("./game/circular_war"),
            displayName:    'Circular War',
            name:           'circular_war',
        },

        player:     {
            speed:          1,        // how many RPS does one move
            standingFrame:  6,        // how many RPSs one new spawned player can stand still
            sprintDistance: 7,
            sprintCD:       30,
        },
    },

    server: {
        // the public hostname, useful for both gameserver and master
	hostname: "637.levy.at",

        // will be used only for gameserver, indicating where's the master
        masterEndPoint: "http://637.levy.at:4000",

        // useful for both server, gameserver use this to register on master
        masterSecret: "BingoLingo!",
    },

    database: {
        url : "mongodb://localhost:27017/enclosure",
    },

    // `pallet` describe the color pattern that will be used for display.
    // if the number of players exceeds the number of colors in the pallet,
    //    some players may have the same color.
    PALLET: [
        // [original, lighten3, darken2, darken4, highContrastText]
        ["#f44336", "#ef9a9a", "#d32f2f", "#b71c1c", "#fff"],   // red
        ["#ab47bc", "#ce93d8", "#7b1fa2", "#4a148c", "#fff"],   // purple
        ["#3f51b5", "#9fa8da", "#303f9f", "#1a237e", "#fff"],   // indigo
        ["#2196f3", "#90caf9", "#1976d2", "#0d47a1", "#fff"],   // blue
        ["#00bcd4", "#80deea", "#0097a7", "#006064", "#000"],   // cyan
        ["#4caf50", "#a5d6a7", "#388e3c", "#1b5e20", "#000"],   // green
        ["#ffeb3b", "#fff59d", "#fbc02d", "#f57f17", "#000"],   // yellow
        ["#ff9800", "#ffcc80", "#f57c00", "#e65100", "#000"],   // orange
        ["#e91e63", "#f48fb1", "#c2185b", "#880e4f", "#fff"],   // pink
        ["#673ab7", "#b39ddb", "#512da8", "#311b92", "#fff"],   // deep purple
        ["#009688", "#80cbc4", "#00796b", "#004d40", "#fff"],   // teal
        ["#cddc39", "#e6ee9c", "#afb42b", "#827717", "#000"],   // lime
        ["#ff5722", "#ffab91", "#e64a19", "#bf360c", "#fff"],   // deep oriange
    ],
};
