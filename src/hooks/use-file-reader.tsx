import { BlobReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js'
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import { toast } from 'sonner'

export function useFileReader() {
	const [rawFile, setRawFile] = useState<File | null>(null)
	const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	const readerRef = useRef<FileReader | null>(null)

	const onFileSelected = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setRawFile(file)
	}, [])

	useEffect(() => {
		if (!rawFile) return

		const abortFileReading = () => {
			if (readerRef.current) {
				readerRef.current.abort()
				readerRef.current = null
			}
		}

		return abortFileReading
	}, [rawFile])

	const extractCapFromZip = useCallback(
		async (zipBuffer: ArrayBuffer): Promise<Uint8Array | null> => {
			try {
				const zipBlob = new Blob([zipBuffer], { type: 'application/zip' })
				const zipReader = new ZipReader(new BlobReader(zipBlob))
				const entries = await zipReader.getEntries()
				const capEntry = entries.find((entry) =>
					entry.filename.toLowerCase().endsWith('.cap'),
				)

				if (!capEntry) {
					toast.error('No .CAP file found in the ZIP archive')
					await zipReader.close()
					return null
				}

				if (capEntry.directory) {
					toast.error(
						"Found a directory named like .CAP file, but it's not a file",
					)
					await zipReader.close()
					return null
				}

				const capContent = await capEntry.getData?.(new Uint8ArrayWriter())

				if (!capContent) {
					toast.error('Failed to extract .CAP file from ZIP')
					await zipReader.close()
					return null
				}

				await zipReader.close()
				toast.success(`Successfully extracted ${capEntry.filename} from ZIP`)
				return capContent
			} catch (err) {
				toast.error(
					`Failed to process ZIP file: ${err instanceof Error ? err.message : 'Unknown error'}`,
				)
				return null
			}
		},
		[],
	)

	useEffect(() => {
		if (!rawFile) {
			setFileBytes(null)
			return
		}

		setIsLoading(true)

		const reader = new FileReader()
		readerRef.current = reader

		const handleLoad = async (e: ProgressEvent<FileReader>) => {
			const arrayBuffer = e.target?.result

			if (!(arrayBuffer instanceof ArrayBuffer)) {
				toast.error('Failed to read file: invalid format')
				setIsLoading(false)
				return
			}

			try {
				const isZip =
					rawFile.name.toLowerCase().endsWith('.zip') ||
					rawFile.type === 'application/zip' ||
					rawFile.type === 'application/x-zip-compressed'

				if (isZip) {
					const capBytes = await extractCapFromZip(arrayBuffer)
					if (capBytes) {
						setFileBytes(capBytes)
						const capFile = new File([capBytes], 'extracted.cap', {
							type: 'application/octet-stream',
						})
						setRawFile(capFile)
					} else {
						setFileBytes(null)
					}
				} else {
					const bytes = new Uint8Array(arrayBuffer)
					setFileBytes(bytes)
				}
			} catch (err) {
				toast.error(
					`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`,
				)
			} finally {
				setIsLoading(false)
				readerRef.current = null
			}
		}

		const handleError = () => {
			toast.error(
				`Error reading file: ${reader.error?.message || 'Unknown error'}`,
			)
			setIsLoading(false)
			readerRef.current = null
		}

		reader.addEventListener('load', handleLoad)
		reader.addEventListener('error', handleError)
		reader.addEventListener('abort', () => {
			setIsLoading(false)
			readerRef.current = null
		})

		try {
			reader.readAsArrayBuffer(rawFile)
		} catch (err) {
			toast.error(
				`Failed to start reading file: ${err instanceof Error ? err.message : 'Unknown error'}`,
			)
			setIsLoading(false)
			readerRef.current = null
		}

		return () => {
			reader.removeEventListener('load', handleLoad)
			reader.removeEventListener('error', handleError)
			reader.removeEventListener('abort', () => {})

			if (reader.readyState === FileReader.LOADING) {
				reader.abort()
			}
		}
	}, [rawFile, extractCapFromZip])

	const reset = useCallback(() => {
		setRawFile(null)
		setFileBytes(null)
		setIsLoading(false)

		if (readerRef.current) {
			readerRef.current.abort()
			readerRef.current = null
		}
	}, [])

	return {
		rawFile,
		fileBytes,
		isLoading,
		onFileSelected,
		reset,
	}
}
