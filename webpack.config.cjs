module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  target: 'node',
  module: {
   rules: [
     {
       test: /\.ts$/,
       use: 'ts-loader',
       exclude: /node_modules/,
     },
   ]
  },
  output: {
    publicPath: '',
    clean: true,
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
  externals: {
    'ffmpeg-static': 'ffmpeg-static',
    'zlib-sync': 'zlib-sync',
    bufferutil: 'bufferutil',
    erlpack: 'erlpack',
    'utf-8-validate': 'utf-8-validate',
  },
  externalsPresets: { node: true },
}