export default function KitchenLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-gray-900">
                {children}
            </body>
        </html>
    )
}
