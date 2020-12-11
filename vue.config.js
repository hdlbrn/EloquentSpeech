module.exports = {
  devServer: {
    proxy: 'http://localhost:4000'
  },
  chainWebpack: config => {
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