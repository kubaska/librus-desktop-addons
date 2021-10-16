const path = require('path');
const WebExtPlugin = require('web-ext-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
    const isChrome = env.dist && env.dist === 'chrome';

    let config = {
        mode: 'development',
        devtool: 'source-map',

        resolve: {
            extensions: [ '.tsx', '.ts', '.js' ]
        },

        entry: {
            'lda-grades': './src/Grades.ts',
            'lda-lessons': './src/Attendance.ts',
            'lda-options': './src/Options.ts'
        },

        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: 'assets', to: 'assets' },
                    { from: 'html/options.src.html', to: 'options.html' }
                ]
            })
        ],

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.json5$/,
                    type: 'asset/resource',
                    generator: {
                        filename: '[name].json'
                    },
                    use: [
                        {
                            loader: "webpack-preprocessor-loader",
                            options: {
                                params: {
                                    firefox: !isChrome
                                }
                            }
                        }
                    ]
                }
            ]
        },

        output: {
            path: path.resolve(__dirname, `dist-${isChrome ? 'chrome' : 'firefox'}`)
        },

        node: false,

        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        name: "vendor",
                        test: /[\\/]node_modules[\\/]/,
                        chunks: "all",
                    },
                },
            }
        }
    };

    if (! isChrome) {
        // add web ext plugin
        config.plugins.push(
            new WebExtPlugin({
                browserConsole: true,
                startUrl: 'https://portal.librus.pl/rodzina/synergia/loguj',
                sourceDir: path.resolve(__dirname, 'dist-firefox')
            })
        );
    }

    return config;
};
