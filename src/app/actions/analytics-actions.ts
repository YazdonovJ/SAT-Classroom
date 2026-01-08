'use server'

import { createClient } from "@/lib/supabase/server"

export interface TeacherAnalytics {
    id: string
    name: string
    email: string
    totalStudents: number
    totalCohorts: number
    weeklyTestsTaken: number
    avgFirstTryScore: number
    bestScore: number
    overallAvgScore: number
}

export async function getTeacherAnalytics(): Promise<{ success: boolean, data?: TeacherAnalytics[], message?: string }> {
    try {
        const supabase = await createClient()

        // 1. Verify Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Unauthorized")

        const { data: userRole } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
            throw new Error("Unauthorized")
        }

        // 2. Fetch all teachers
        const { data: teachers, error: teacherError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('role', 'teacher')
            .order('created_at', { ascending: false })

        if (teacherError) throw teacherError

        // 3. Fetch analytics for each teacher
        // This could be optimized with a complex join or RPC, but for now we'll do parallel fetches
        // which is fine for < 100 teachers.
        const analytics = await Promise.all(teachers.map(async (teacher) => {
            // Get teacher's cohorts
            const { data: cohorts } = await supabase
                .from('cohort_teachers')
                .select('cohort_id')
                .eq('user_id', teacher.id)

            const cohortIds = cohorts?.map(c => c.cohort_id) || []

            // Get students in these cohorts
            // Note: A student could be in multiple cohorts, so we need distinct users
            let totalStudents = 0
            let studentIds: string[] = []

            if (cohortIds.length > 0) {
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('user_id')
                    .in('cohort_id', cohortIds)

                const uniqueStudents = new Set(enrollments?.map(e => e.user_id))
                totalStudents = uniqueStudents.size
                studentIds = Array.from(uniqueStudents)
            }

            // Get test attempts by these students
            // Since we can't easily join "attempts by students IN SPECIFIC COHORT TAUGHT BY THIS TEACHER",
            // we will approximate by "attempts by students who are enrolled in this teacher's classes".
            // This is a reasonable approximation for a simple MVP.

            let attempts: any[] = []
            if (studentIds.length > 0) {
                const { data: rawAttempts } = await supabase
                    .from('test_attempts')
                    .select('score, submitted_at, user_id, test_id')
                    .in('user_id', studentIds)
                    .order('submitted_at', { ascending: true }) // Order by time for "first try" check

                attempts = rawAttempts || []
            }

            // --- Metrics Calculation ---

            // 1. Weekly Tests Taken (Activity)
            const oneWeekAgo = new Date()
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
            const weeklyAttempts = attempts.filter(a => new Date(a.submitted_at) >= oneWeekAgo).length
            // Normalize by students? Or just raw count? 
            // The prompt asks for "weekly students average completion".
            // Let's do: Avg tests per student this week. 
            const weeklyTestsPerStudent = totalStudents > 0
                ? Math.round((weeklyAttempts / totalStudents) * 10) / 10
                : 0

            // 2. Avg Score (First Try)
            // We need to identify which attempt was the "first" for each student+test combo
            const firstAttempts = new Map<string, number>() // key: studentId-testId, value: score

            attempts.forEach(a => {
                const key = `${a.user_id}-${a.test_id}`
                if (!firstAttempts.has(key)) {
                    firstAttempts.set(key, a.score) // Since we ordered by ascending time, the first one we see is the first attempt
                }
            })

            const firstTryScores = Array.from(firstAttempts.values())
            const avgFirstTryScore = firstTryScores.length > 0
                ? Math.round(firstTryScores.reduce((a, b) => a + b, 0) / firstTryScores.length)
                : 0

            // 3. Best Results
            // Simply the max score achieved by any student
            const bestScore = attempts.length > 0
                ? Math.max(...attempts.map(a => a.score))
                : 0

            // 4. Overall Avg (Groups Average)
            const overallAvgScore = attempts.length > 0
                ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length)
                : 0

            return {
                id: teacher.id,
                name: teacher.full_name || 'Unknown',
                email: teacher.email || '',
                totalStudents,
                totalCohorts: cohortIds.length,
                weeklyTestsTaken: weeklyTestsPerStudent,
                avgFirstTryScore,
                bestScore,
                overallAvgScore
            }
        }))

        return { success: true, data: analytics }

    } catch (error: any) {
        console.error("Teacher analytics error:", error)
        return { success: false, message: error.message }
    }
}
