import KitchenDisplay from '@/components/kitchen/kitchen-display'

export default async function KitchenPage() {
    // In a real app, you would get the default station from user settings or URL
    const defaultLocationId = 'default-location'
    const defaultStationId = 'default-station'

    return (
        <KitchenDisplay
            stationId={defaultStationId}
            locationId={defaultLocationId}
            stationName="Main Kitchen"
        />
    )
}
