import {
	ChangeEvent,
	FC,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

enum IFFmpegLoadState {
	Unloaded,
	Loading,
	Loaded,
}

const DownloadFileFromURL = (url: string, fileName: string) => {
	const a = document.createElement('a')

	a.href = url
	a.download = fileName

	document.body.appendChild(a)

	a.style.display = 'none'

	a.click()
	a.remove()
}

const App: FC = () => {
	const [SelectedFile, SetSelectedFile] = useState<File | null>(null)
	const [FFmpegLoadState, SetFFmpegLoadState] = useState<IFFmpegLoadState>(
		IFFmpegLoadState.Unloaded,
	)
	const [FFmpegLog, SetFFmpegLog] = useState<string>('')

	const [TargetWidth, SetTargetWidth] = useState<number>(1000)
	const [TargetHeight, SetTargetHeight] = useState<number>(1000)

	const FFmpegRef = useRef<FFmpeg>(new FFmpeg())
	const InputRef = useRef<HTMLInputElement>(null)

	const OnFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const file = event?.target?.files?.[0] ?? null

		SetSelectedFile(file)
	}, [])

	const OnCompress = useCallback(async () => {
		if (!SelectedFile) return

		const fileName = SelectedFile.name
		const outputFileName = `output ${fileName}`

		const fileBuffer = new Uint8Array(await SelectedFile.arrayBuffer())

		const ffmpeg = FFmpegRef.current

		console.log(await ffmpeg.listDir('/'))

		await ffmpeg.writeFile(fileName, fileBuffer)

		console.log(await ffmpeg.listDir('/'))

		await ffmpeg.exec([
			'-i',
			fileName,
			'-vf',
			`scale=${TargetWidth}x${TargetHeight}`,
			outputFileName,
		])

		const output = (await ffmpeg.readFile(outputFileName)) as Uint8Array
		const outputBuffer = output.buffer

		const objectURL = URL.createObjectURL(
			new Blob([outputBuffer], { type: SelectedFile.type }),
		)

		DownloadFileFromURL(objectURL, outputFileName)

		URL.revokeObjectURL(objectURL)
	}, [SelectedFile, TargetHeight, TargetWidth])

	const OnLoadFFmpeg = useCallback(async () => {
		SetFFmpegLoadState(IFFmpegLoadState.Loading)

		const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'

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
			workerURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.worker.js`,
				'text/javascript',
			),
		})

		SetFFmpegLoadState(IFFmpegLoadState.Loaded)
	}, [])

	useEffect(() => {
		if (!InputRef.current) return

		const dataTransfer = new DataTransfer()

		if (SelectedFile && SelectedFile.type.startsWith('video/'))
			dataTransfer.items.add(SelectedFile)

		InputRef.current.files = dataTransfer.files
	}, [SelectedFile])

	return (
		<div>
			{FFmpegLoadState === IFFmpegLoadState.Loaded ? (
				<>
					<input type='file' onChange={OnFileChange} ref={InputRef} />
					<input
						type='number'
						onChange={event =>
							SetTargetWidth(event.target.valueAsNumber)
						}
						value={TargetWidth}
						placeholder='Target Height'
					/>
					<input
						type='number'
						onChange={event =>
							SetTargetHeight(event.target.valueAsNumber)
						}
						value={TargetHeight}
						placeholder='Target Height'
					/>
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
