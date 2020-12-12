const path = require("path");

module.exports = {
  devServer: {
    proxy: 'http://localhost:4000'
  },
  chainWebpack: config => {
    config
      .entry("app")
      .clear()
      .add("./src/ui/main.ts")
      .end();
    config.resolve.alias
      .set("@", path.join(__dirname, "./src/ui"))
      .end();
    config
      .plugin('html')
      .tap(args => {
        args[0].title = "EloquentSpeech";
        return args;
      })
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: 'EloquentSpeech',
        files: [
          "**/*"
        ],
        extraFiles: [
          {
            from: "deepspeech-models",
            to: "deepspeech-models",
            filter: ["**/*"]
          }
        ]
      }
    }
  }
}