module.exports={
    // `game` describe attributes about a game and will be transmitted to client
    // before connecting to server.
    game: {
        FPS:        40,
        RPS:        8,
        MapSize:    [100, 100],
        player:     {
            speed:  4,  // how many RPS does one move
        },
    },

    server: {
        // the public hostname, useful for both gameserver and master
        hostname: "aws.levy.at",

        // will be used only for gameserver, indicating where's the master
        masterEndPoint: "http://aws.levy.at:3000",
        // useful for both server, gameserver use this to register on master
        masterSecret: "BingoLingo!",
    },

    // `pallet` describe the color pattern that will be used for display.
    // if the number of players exceeds the number of colors in the pallet,
    //    some players may have the same color.
    PALLET: [
        // [original, lighten3, darken2, darken4]
        ["#f44336", "#ef9a9a", "#d32f2f", "#b71c1c"],   // red
        ["#ab47bc", "#ce93d8", "#7b1fa2", "#4a148c"],   // purple
        ["#3f51b5", "#9fa8da", "#303f9f", "#1a237e"],   // indigo
        ["#2196f3", "#90caf9", "#1976d2", "#0d47a1"],   // blue
        ["#00bcd4", "#80deea", "#0097a7", "#006064"],   // cyan
        ["#4caf50", "#a5d6a7", "#388e3c", "#1b5e20"],   // green
        ["#ffeb3b", "#fff59d", "#fbc02d", "#f57f17"],   // yellow
        ["#ff9800", "#ffcc80", "#f57c00", "#e65100"],   // orange
    ],
};
