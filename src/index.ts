import * as webpack from 'webpack';
import { createInstrumenter } from 'istanbul-lib-instrument';
import { RawSourceMap } from 'source-map';

/**
 * Take a source file and run it through istanbul for instrumentation
 *
 * @param content the source code
 * @param sourceMap The source map object
 */
export default function(
	this: webpack.loader.LoaderContext,
	content: string,
	sourceMap?: RawSourceMap
) {
	const instrumenter = createInstrumenter({
		produceSourceMap: true,
		esModules: true
	});

	// For the code coverage to work we need to modify the sources in the
	// source map to point back to the original file. The files coming in have
	// been generated by webpack and look like,
	// "node_modules/tslint-loader?!path/to/file/css-modules!path/to/file.ts.
	// We need these files to simply be "path/to/file.ts".
	if (sourceMap && sourceMap.sources) {
		sourceMap.sources = sourceMap.sources.map(source => {
			const lastExclaim = source.lastIndexOf('!');
			if (lastExclaim !== -1) {
				return source.substr(lastExclaim + 1);
			}
			return source;
		});
	}

	const callback = this.async()!;

	instrumenter.instrument(
		content,
		this.resourcePath,
		(error, instrumentedSource) => {
			if (error) {
				callback(error);
			} else {
				callback(
					null,
					instrumentedSource,
					JSON.stringify(instrumenter.lastSourceMap())
				);
			}
		},
		sourceMap
	);
}
