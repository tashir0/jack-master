module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  target: 'node',
  module: {
   rules: [
     {
       test: /\.ts$/,
       use: 'ts-loader',
     },
     {
       test: /\.node$/,
       use: 'file-loader',
     },
   ]
  },
  output: {
    publicPath: '',
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
    fallback: {
      util: false,
      path: false,
      stream: false,
      fs: false,
      buffer: false,
    },
  },
  externalsPresets: { node: true },
}