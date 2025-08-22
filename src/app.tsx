import { BiosInfoCard } from '@/components/bios-info-card.tsx'

function App() {
	return (
		<div className="bg-muted flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm flex flex-col items-center gap-2">
				<h1 className="text-2xl font-bold">ASUS BIOS Renamer</h1>
				<BiosInfoCard />
				<div className="text-muted-foreground text-center text-xs text-balance">
					Version {import.meta.env.VERSION}
					<br />
					Built with 🫕 by{' '}
					<a
						href="https://bsky.app/profile/stouder.io"
						target="_blank"
						rel="noopener"
					>
						Xavier Stouder
					</a>
				</div>
			</div>
		</div>
	)
}

export default App
