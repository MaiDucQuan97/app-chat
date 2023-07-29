module.exports = {
    apps: [
        {
            name: "app-chat",
            script: "./src/app.js",
            watch: false,
            ignore_watch: [
                ".git",
                ".md",
            ],
            time: true,
            env: {
                PORT: process.env.PORT,
                HOSTNAME: process.env.HOSTNAME,
                MONGOOSE_URI: process.env.MONGOOSE_URI,
                JWT_SECRET_KEY: process.env.JWT_SECRET_KEY
            },
        },
    ],
};