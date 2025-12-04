import dynamic from 'next/dynamic'

// Dynamically import the client layout with no SSR
const DashboardLayoutClient = dynamic(() => import('@/components/layouts/DashboardLayoutClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-lg">در حال بارگذاری...</div>
    </div>
  )
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
