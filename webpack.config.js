const path = require('path');

//alterado de env para poder publicar em staging
const mode = process.env.WEBPACK_MODE || 'production';
const watch = !!process.env.WEBPACK_WATCH; 

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const VirtualModulesPlugin = require('webpack-virtual-modules');
const fs = require('fs');
function walkSync(dir) {
  const paths = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (let i = 0; i < files.length; i++) {
    if (files[i].isDirectory()) {
      walkSync(path.join(dir, files[i].name)).forEach((p) => paths.push(p));
    } else {
      paths.push(path.join(dir, files[i].name));
    }
  }
  return paths;
}

const vue_components_folder = 'src/components/';
const vue_components_files = walkSync(vue_components_folder);
const components = [];
for (let i in vue_components_files) {
  const file = vue_components_files[i];
  if (file.endsWith('.vue')) {
    const component = file.substr(vue_components_folder.length, file.length - vue_components_folder.length - 4).split('/').filter(p => p).join(':');
    components.push({ file: '../' + file, slug: 'vue:' + component.toLowerCase() });
  }
}

module.exports = {
  entry: './src/index.js',
  plugins: [
    new VirtualModulesPlugin({
      'node_modules/VueComponents.js': `
      import { defineAsyncComponent } from 'vue/dist/vue.esm-bundler.js';
      const modules = {};
      ${components.map((component) => {
      
      return `
      modules[${JSON.stringify(component.slug)}] =  defineAsyncComponent(async ()=> {
          const Component = (await import(${JSON.stringify(component.file)})).default;
          return {
                  components: {'dynamic': Component},
                  template: '<dynamic v-bind="$attrs"><template v-for="(_, name) in $slots" v-slot:[name]="slotData"><slot :name="name" v-bind="slotData" /></template></dynamic>'              
          };
        });`
      }).join('')}
      export default modules;
      `
    }),
    new VueLoaderPlugin(),
    //expose only needed envs
    new DefinePlugin({
      '__VUE_OPTIONS_API__': mode !== 'production',
      '__VUE_PROD_DEVTOOLS__': mode !== 'production',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/static'),
          globOptions: {
            dot: true,
            gitignore: true,
          },
          to: path.resolve(__dirname, 'static')
        }
      ],
      options: {
        concurrency: 100
      }
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].[contenthash].css'
    }),
    new WebpackAssetsManifest({
      entrypoints: true,
      entrypointsUseAssets: true,
      output: 'asset-manifest.json',
      transform: (assets, manifest) => {
        const entrypoints = assets.entrypoints;
        delete assets.entrypoints;
        return {
          files: Object.entries(assets).reduce((obj, [key, value]) => {
            if (!value.startsWith('/')) value = '/' + value;
            obj[key] = value;
            return obj;
          }, {}),
          entrypoints: [
            ...((((entrypoints || {}).main || {}).assets || {}).js || []),
            ...((((entrypoints || {}).main || {}).assets || {}).css || [])
          ]
        };
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader'
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader']
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-react'],
            plugins: ['@babel/plugin-proposal-class-properties', 'syntax-dynamic-import']
          }
        }
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp|apng|avif|jfif|pjpeg|pjp|ico|cur|tif|tiff)$/i,
        loader: 'file-loader',
        options: {
          publicPath: '/img/',
          name(resourcePath, resourceQuery) {
            // `resourcePath` - `/absolute/path/to/file.js`
            // `resourceQuery` - `?foo=bar`

            if (mode === 'development') {
              return '[name].[contenthash].[ext]';
            }

            return '[contenthash].[ext]';
          },
          outputPath: (url, resourcePath, context) => {
            return `img/${url}`;
          }
        }
      },
      {
        test: /\.s?(c|a)ss$/,
        exclude: /node_modules/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          // [css-loader](/loaders/css-loader)
          {
            loader: 'css-loader',
            options: {
              sourceMap: mode === 'development'
            }
          },
          // [sass-loader](/loaders/sass-loader)
          {
            loader: 'sass-loader',
            options: {
              sourceMap: mode === 'development'
            }
          },
          
        ]
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js']
  },
  mode,
  stats: mode === 'development' ? true : 'errors-only',
  output: {
    filename: 'js/[name].[fullhash].js',
    chunkFilename: 'js/[id].[chunkhash].js',
    path: path.resolve(__dirname, 'static'),
    clean: true,
    publicPath: '/'
  },
  watch: watch,
  devtool: mode === 'development' ? 'eval-source-map' : undefined,
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/
  }
};
