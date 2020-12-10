module.exports = {
  devServer: {
    proxy: 'http://localhost:4000'
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        "files": [
          "**/*"
        ],
        "extraFiles": [
          {
            "from": "deepspeech-models",
            "to": "deepspeech-models",
            "filter": ["**/*"]
          }
        ]
      }
    }
  }
}