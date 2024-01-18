import { ChangeEvent, FC, useCallback, useState } from 'react'

const App: FC = () => {
	const [SelectedFile, SetSelectedFile] = useState<File | null>(null)

	const OnFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		SetSelectedFile(event?.target?.files?.[0] ?? null)
	}, [])

	return (
		<div>
			<input type='file' onChange={OnFileChange} />
		</div>
	)
}

export default App
