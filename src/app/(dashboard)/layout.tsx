
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="flex h-screen w-full flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sticky top-0 z-50">
                <Link className="flex items-center gap-2 font-semibold" href="/">
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        SAT Classroom
                    </span>
                </Link>
                <div className="ml-auto flex items-center gap-2">
                    <NotificationBell userId={user.id} />
                    <Link href="/profile">
                        <Button size="sm" variant="ghost">
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </Button>
                    </Link>
                    <form action="/auth/signout" method="post">
                        <Button size="sm" variant="ghost">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-auto">
                {children}
            </main>
        </div>
    )
}
