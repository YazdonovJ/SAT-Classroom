import { checkTeacher } from "@/lib/check-role"

export default async function TeacherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    await checkTeacher()
    return <>{children}</>
}
