module.exports = {
	mode   : 'production',
	entry  : ['./demo/app.ts'],
	output : {
		path    : __dirname + '/demo',
		filename: 'app.js'
	},
	resolve: {
		extensions: ['.ts']
	},
	devtool: '#source-map',
	module : {
		rules: [
			// all files with a '.ts' extension will be handled by 'ts-loader'
			{test: /\.ts$/, use: 'ts-loader'}
		]
	}
}
