import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function MemberCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden border-border/40 bg-card rounded-2xl min-h-[300px]">
      <CardContent className="p-6 sm:p-8 flex-1 flex flex-col">
        {/* Name and Formação - Primary Block */}
        <div className="mb-5 space-y-3">
          <Skeleton className="h-7 w-3/4 rounded-md" />
          <Skeleton className="h-5 w-1/2 rounded-md" />
        </div>

        {/* Meta Data Badges - Secondary Block */}
        <div className="flex items-start mb-6 gap-3">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>

        {/* Contact and Projects */}
        <div className="mb-2 flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            <Skeleton className="h-5 w-full rounded-md" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3 w-1/2">
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              <Skeleton className="h-5 w-full rounded-md" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-border/40 flex justify-end gap-2">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}
