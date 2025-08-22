const INFO_HEADER_LEN: number = 9
const BIOS_INFO_HEADER: Uint8Array = new Uint8Array([
	0x24, 0x42, 0x4f, 0x4f, 0x54, 0x45, 0x46, 0x49, 0x24,
])
const BIOS_INFO_SIZE: number = 158

const BOARD_NAME_OFFSET: number = 0x05
const BOARD_NAME_LEN: number = 60

const BRAND_NAME_OFFSET: number = 0x41
const BRAND_NAME_LEN: number = 20

const DATE_OFFSET: number = 0x56
const DATE_LEN: number = 10

const BUILD_NUMBER_OFFSET: number = 0x61
const BUILD_NUMBER_LEN: number = 14

const CAP_NAME_OFFSET: number = 0x88
const CAP_NAME_LEN: number = 12

export interface BiosInfo {
	boardName: string
	brand: string
	buildDate: Date | null
	buildNumber: string
	expectedName: string
}

function bytesToString(
	buffer: ArrayBuffer,
	offset: number,
	length: number,
): string {
	const view = new Uint8Array(buffer, offset, length)
	let result = ''

	for (let i = 0; i < length; i++) {
		const byte = view[i]
		if (byte === 0) break
		result += String.fromCharCode(byte)
	}

	return result
}

function parseDate(dateStr: string): Date | null {
	const [month, day, year] = dateStr.split('/').map(Number)
	if (isNaN(month) || isNaN(day) || isNaN(year)) {
		return null
	}
	return new Date(year, month - 1, day)
}

function findBootEfiHeader(buffer: ArrayBuffer): number | null {
	const view = new Uint8Array(buffer)

	for (let i = 0; i <= view.length - INFO_HEADER_LEN; i++) {
		let found = true

		for (let j = 0; j < INFO_HEADER_LEN; j++) {
			if (view[i + j] !== BIOS_INFO_HEADER[j]) {
				found = false
				break
			}
		}

		if (found) {
			return i + INFO_HEADER_LEN
		}
	}

	return null
}

export function parseBiosInfo(buffer: ArrayBuffer): BiosInfo {
	const headerPos = findBootEfiHeader(buffer)

	if (headerPos === null) {
		throw new Error('Failed to find boot efi header')
	}

	if (headerPos + BIOS_INFO_SIZE > buffer.byteLength) {
		throw new Error('BIOS info header is too large')
	}

	const boardName = bytesToString(
		buffer,
		headerPos + BOARD_NAME_OFFSET,
		BOARD_NAME_LEN,
	)
	const brand = bytesToString(
		buffer,
		headerPos + BRAND_NAME_OFFSET,
		BRAND_NAME_LEN,
	)

	const dateStr = bytesToString(buffer, headerPos + DATE_OFFSET, DATE_LEN)
	const buildDate = parseDate(dateStr)

	const buildNumber = bytesToString(
		buffer,
		headerPos + BUILD_NUMBER_OFFSET,
		BUILD_NUMBER_LEN,
	)
	const expectedName = bytesToString(
		buffer,
		headerPos + CAP_NAME_OFFSET,
		CAP_NAME_LEN,
	)

	return {
		boardName,
		brand,
		buildDate,
		buildNumber,
		expectedName,
	}
}

export async function readBiosInfoFromFile(
	file: File,
): Promise<BiosInfo | null> {
	const arrayBuffer = await file.arrayBuffer()
	return parseBiosInfo(arrayBuffer)
}

export function isFileValid(file: File): boolean {
	return file.size > 0 && file.type !== 'directory'
}
