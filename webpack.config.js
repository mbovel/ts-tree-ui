module.exports = {
	mode   : 'production',
	entry  : ['./demo/app.ts'],
	output : {
		path    : __dirname + '/demo',
		filename: 'app.js'
	},
	resolve: {
		extensions: ['.js', '.ts', '.json']
	},
	devtool: '#source-map',
	module : {
		rules: [
			// all files with a '.ts' extension will be handled by 'ts-loader'
			{test: /\.ts$/, use: {loader: 'ts-loader', options: {configFile: "tsconfig-webpack.json"}}}
		]
	}
}
