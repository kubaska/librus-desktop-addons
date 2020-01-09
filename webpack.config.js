const path = require('path');
const WebExtWebpackPlugin = require('web-ext-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const commonConfig = {
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
};

const commonRules = [
    {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
    },
    {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
    },
];

const firefoxConfig = {
    plugins: [
        new WebExtWebpackPlugin({
            browserConsole: true,
            startUrl: ['https://portal.librus.pl/rodzina'],
            sourceDir: path.resolve(__dirname, 'dist-firefox')
        }),
        new CopyPlugin([
            { from: 'assets', to: 'assets' },
            { from: 'html/options.src.html', to: 'options.html' }
        ])
    ],

    module: {
        rules: [
            ...commonRules,
            {
                test: /\.json.src$/,
                use: [
                    { loader: 'file-loader', options: { name: '[name]' } },
                    { loader: "webpack-preprocessor?definitions=['firefox']" }
                ]
            }
        ]
    },

    output: {
        path: path.resolve(__dirname, 'dist-firefox')
    },
};

const chromeConfig = {
    plugins: [
        new CopyPlugin([
            { from: 'assets', to: 'assets' },
            { from: 'html/options.src.html', to: 'options.html' }
        ])
    ],

    module: {
        rules: [
            ...commonRules,
            {
                test: /\.json.src$/,
                use: [
                    { loader: 'file-loader', options: { name: '[name]' } },
                    { loader: "webpack-preprocessor?definitions=['chrome']" },
                ],
            },
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist-chrome')
    },
};

module.exports = (env, argv) => {
    if (argv.dist && argv.dist === 'chrome')
        return {...commonConfig, ...chromeConfig};
    else
        return {...commonConfig, ...firefoxConfig};
};