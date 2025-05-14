const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const fs = require('fs');

module.exports = {
  entry: "./src/app.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      buffer: require.resolve("buffer/"),
    },
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/vie.html",
    }),
  ],
  mode: "development",
  devServer: {
    server: {
      type: 'https',
      options: {
        key: fs.readFileSync('./localhost-key.pem'),
        cert: fs.readFileSync('./localhost.pem'),
      },
    },
    host: "0.0.0.0", // Позволяет доступ с любого IP
    port: 8080, // Указываем порт, на котором будет доступен сервер
    open: true, // Автоматически открывает браузер
    historyApiFallback: true, // Для работы с маршрутизацией, если она используется
    static: {
      directory: path.join(__dirname, 'dist'), // Обслуживание файлов из папки dist
    },
  },
};
