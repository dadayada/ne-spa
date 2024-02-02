const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin').WebpackManifestPlugin;
const path = require('path');

const replacePlugin = (plugins, nameMatcher, newPlugin) => {
  const pluginIndex = plugins.findIndex(plugin => {
    return (
      plugin.constructor &&
      plugin.constructor.name &&
      nameMatcher(plugin.constructor.name)
    );
  });

  if (pluginIndex === -1) return plugins;

  return plugins
    .slice(0, pluginIndex)
    .concat(newPlugin)
    .concat(plugins.slice(pluginIndex + 1));
};

module.exports = {
  webpack: {
    plugins: {
      add: [
        new HtmlWebpackPlugin({
          filename: 'login/index.html',
          chunks: ['login'],
          template: 'public/index.html'
        }),
        new HtmlWebpackPlugin({
          filename: 'user/index.html',
          chunks: ['user'],
          template: 'public/index.html'
        }),
      ],
    },
    configure: (webpackConfig, { env, paths }) => {
      const isEnvDevelopment = env.NODE_ENV !== 'production';
      const isEnvProduction = env.NODE_ENV === 'production';
      const publicPath = isEnvProduction
        ? paths.servedPath
        : isEnvDevelopment && '/';
      const multiEntryManfiestPlugin = new ManifestPlugin({
        fileName: 'manifest.json',
        publicPath: publicPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);

          const entrypointFiles = {};
          Object.keys(entrypoints).forEach(entrypoint => {
            entrypointFiles[entrypoint] = entrypoints[entrypoint].filter(
              fileName => !fileName.endsWith('.map')
            );
          });

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          };
        },
      });

      webpackConfig.plugins = replacePlugin(
        webpackConfig.plugins,
        name => /ManifestPlugin/i.test(name),
        multiEntryManfiestPlugin
      );
      webpackConfig.entry = {
        login: path.resolve(__dirname, './src/login/index.tsx'),
        user: path.resolve(__dirname, './src/user/index.tsx'),
      };
      return webpackConfig;
    },
  },
};
