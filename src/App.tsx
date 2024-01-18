import { ChangeEvent, FC, useCallback, useRef, useState } from 'react'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

enum IFFmpegLoadState {
	Unloaded,
	Loading,
	Loaded,
}

const App: FC = () => {
	const [SelectedFile, SetSelectedFile] = useState<File | null>(null)
	const [FFmpegLoadState, SetFFmpegLoadState] = useState<IFFmpegLoadState>(
		IFFmpegLoadState.Unloaded,
	)
	const [FFmpegLog, SetFFmpegLog] = useState<string>('')

	const FFmpegRef = useRef<FFmpeg>(new FFmpeg())

	const OnFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		SetSelectedFile(event?.target?.files?.[0] ?? null)
	}, [])

	const OnCompress = useCallback(() => {
		console.log(SelectedFile)
	}, [SelectedFile])

	const OnLoadFFmpeg = useCallback(async () => {
		SetFFmpegLoadState(IFFmpegLoadState.Loading)

		const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

		fetchFile

		FFmpegRef.current.on('log', ({ message }) => {
			SetFFmpegLog(prev => `${prev}\n${message}`)
		})

		// toBlobURL is used to bypass CORS issue, urls with the same domain can be used directly.

		await FFmpegRef.current.load({
			coreURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.js`,
				'text/javascript',
			),
			wasmURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.wasm`,
				'application/wasm',
			),
		})

		SetFFmpegLoadState(IFFmpegLoadState.Loaded)
	}, [])

	return (
		<div>
			{FFmpegLoadState === IFFmpegLoadState.Loaded ? (
				<>
					<input type='file' onChange={OnFileChange} />
					<button onClick={OnCompress}>Compress</button>
					<pre>{FFmpegLog}</pre>
				</>
			) : FFmpegLoadState === IFFmpegLoadState.Unloaded ? (
				<button onClick={OnLoadFFmpeg}>Load FFmpeg</button>
			) : (
				<p>Loading FFmpeg</p>
			)}
		</div>
	)
}

export default App
