import { Skeleton } from '@/components/ui/skeleton'

export default function CustomerLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center space-y-8">
       {/* Central Brand Loading */}
       <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
             <div className="h-10 w-10 rounded-full bg-primary" />
          </div>
          <Skeleton className="h-6 w-32" />
       </div>
       
       {/* Subtle loading text */}
       <p className="text-sm text-muted-foreground animate-pulse">Loading deliciousness...</p>
    </div>
  )
}
