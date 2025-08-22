import { DownloadIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Spinner } from '@/components/ui/shadcn-io/spinner'
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from '@/components/ui/table.tsx'
import { useFileReader } from '@/hooks/use-file-reader.tsx'
import { type BiosInfo, readBiosInfoFromFile } from '@/lib/bios.ts'

export function BiosInfoCard() {
	const { onFileSelected, isLoading, rawFile, reset, fileBytes } =
		useFileReader()
	const [biosInfo, setBiosInfo] = useState<BiosInfo | null>(null)

	useEffect(() => {
		if (rawFile === null || fileBytes === null) {
			return
		}
		readBiosInfoFromFile(rawFile)
			.then(setBiosInfo)
			.catch((error) => {
				toast.error(error.message)
				reset()
			})
	}, [fileBytes, rawFile, reset])

	const download = useCallback(async () => {
		if (rawFile === null || fileBytes === null || biosInfo === null) return

		const arrayBuffer = await rawFile.arrayBuffer()
		const renamedFile = new File([arrayBuffer], biosInfo.expectedName, {
			type: rawFile.type,
			lastModified: rawFile.lastModified,
		})
		const url = URL.createObjectURL(rawFile)

		const a = document.createElement('a')
		a.href = url
		a.download = renamedFile.name
		document.body.appendChild(a)
		a.click()

		setTimeout(() => {
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		}, 100)
	}, [rawFile, fileBytes, biosInfo])

	return (
		<>
			{!rawFile && (
				<Card>
					<CardHeader>
						<CardTitle>Select a file</CardTitle>
						<CardDescription>
							Select the BIOS driver that you downloaded from ASUS website.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Input
							type="file"
							onChange={onFileSelected}
							accept=".CAP,.ZIP"
							disabled={isLoading}
						/>

						{isLoading && <p>Loading file...</p>}
					</CardContent>
				</Card>
			)}
			{rawFile && !biosInfo && (
				<Card>
					<CardContent>
						<Spinner variant="infinite" size={72} />
					</CardContent>
				</Card>
			)}
			{biosInfo && (
				<Card>
					<CardHeader>
						<CardTitle>BIOS infos</CardTitle>
						<CardDescription>Decoded from the CAP file</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<Table>
							<TableBody>
								<TableRow>
									<TableCell className="font-medium">Board name</TableCell>
									<TableCell>{biosInfo.boardName}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">Brand</TableCell>
									<TableCell>{biosInfo.brand}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">Build date</TableCell>
									<TableCell>{biosInfo.buildDate?.toLocaleString()}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">Build number</TableCell>
									<TableCell>{biosInfo.buildNumber}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">Expected name</TableCell>
									<TableCell>{biosInfo.expectedName}</TableCell>
								</TableRow>
							</TableBody>
						</Table>
						<div className="flex justify-end">
							<Button
								disabled={rawFile === null}
								onClick={download}
								variant="outline"
							>
								<DownloadIcon />
								Save renamed
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</>
	)
}
