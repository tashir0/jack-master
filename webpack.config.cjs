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
    // Peer dependency of prism-media used by discordjs
    'ffmpeg-static': 'ffmpegstatic',
    // Optional packages for discordjs which we are not using
    'zlib-sync': 'zlib-sync',
    bufferutil: 'bufferutil',
    erlpack: 'erlpack',
    'utf-8-validate': 'utf-8-validate',
  },
  externalsPresets: { node: true },
}