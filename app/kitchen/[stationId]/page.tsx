import KitchenDisplay from '@/components/kitchen/kitchen-display'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'

interface PageProps {
    params: Promise<{ stationId: string }>
}

export default async function StationKitchenPage({ params }: PageProps) {
    const { stationId } = await params

    // Fetch station details
    const station = await prisma.kitchenStation.findUnique({
        where: { id: stationId },
        include: {
            location: { select: { id: true, name: true } }
        }
    })

    if (!station) {
        notFound()
    }

    return (
        <KitchenDisplay
            stationId={station.id}
            locationId={station.locationId}
            stationName={station.name}
        />
    )
}
