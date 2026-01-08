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

export async function getTeacherAnalytics(startDate?: string, endDate?: string): Promise<{ success: boolean, data?: TeacherAnalytics[], message?: string }> {
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

        // 2. Fetch all teachers including their cohorts explicitly
        const { data: teachers, error: teacherError } = await supabase
            .from('users')
            .select(`
                id, 
                full_name, 
                email,
                cohort_teachers(cohort_id)
            `)
            .eq('role', 'teacher')
            .order('created_at', { ascending: false })

        if (teacherError) throw teacherError

        // 3. Process each teacher
        const analytics = await Promise.all(teachers.map(async (teacher) => {
            const cohortIds = teacher.cohort_teachers?.map((ct: any) => ct.cohort_id) || []

            // Get students in these cohorts
            let totalStudents = 0
            let studentIds: string[] = []

            if (cohortIds.length > 0) {
                // Get enrollments by cohort
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('user_id')
                    .in('cohort_id', cohortIds)

                const uniqueStudents = new Set(enrollments?.map(e => e.user_id))
                totalStudents = uniqueStudents.size
                studentIds = Array.from(uniqueStudents)
            }

            // Get test attempts by these students
            // We use the date filter here
            let attempts: any[] = []
            if (studentIds.length > 0) {
                let query = supabase
                    .from('test_attempts')
                    .select('score, submitted_at, user_id, test_id')
                    .in('user_id', studentIds)
                    .order('submitted_at', { ascending: true })

                // Apply date filter if provided
                if (startDate) {
                    query = query.gte('submitted_at', startDate)
                }
                if (endDate) {
                    // Start of next day for end date or just use raw strings if ISO
                    // Assuming string provided is YYYY-MM-DD
                    const end = new Date(endDate)
                    end.setHours(23, 59, 59, 999)
                    query = query.lte('submitted_at', end.toISOString())
                }

                const { data: rawAttempts } = await query
                attempts = rawAttempts || []
            }

            // --- Metrics Calculation ---

            // 1. Weekly/Period Completion
            // If date filter is active, this is "Tests in Period". If not, default to "Last 7 Days".

            let periodAttempts = attempts
            if (!startDate && !endDate) {
                const oneWeekAgo = new Date()
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                periodAttempts = attempts.filter(a => new Date(a.submitted_at) >= oneWeekAgo)
            }

            // Avg tests per student
            // Avoid division by zero
            const completionRate = totalStudents > 0
                ? Math.round((periodAttempts.length / totalStudents) * 10) / 10
                : 0

            // 2. Avg Score (First Try)
            // We simplify First Try logic for now to be: "Avg of best scores per test per student in this period" 
            // OR strictly "Avg of all attempts in period".
            // Let's go with: Unique attempts per student-test.
            const uniqueAttemptsInPeriod = new Map<string, number>()
            attempts.forEach(a => {
                const key = `${a.user_id}-${a.test_id}`
                if (!uniqueAttemptsInPeriod.has(key)) {
                    uniqueAttemptsInPeriod.set(key, a.score)
                }
            })

            const avgScoreInPeriod = uniqueAttemptsInPeriod.size > 0
                ? Math.round(Array.from(uniqueAttemptsInPeriod.values()).reduce((a, b) => a + b, 0) / uniqueAttemptsInPeriod.size)
                : 0

            // 3. Best Results (In Period)
            const bestScore = attempts.length > 0
                ? Math.max(...attempts.map(a => a.score))
                : 0

            return {
                id: teacher.id,
                name: teacher.full_name || 'Unknown',
                email: teacher.email || '',
                totalStudents,
                totalCohorts: cohortIds.length,
                weeklyTestsTaken: completionRate,
                avgFirstTryScore: avgScoreInPeriod,
                bestScore,
                overallAvgScore: avgScoreInPeriod
            }
        }))

        return { success: true, data: analytics }

    } catch (error: any) {
        console.error("Teacher analytics error:", error)
        return { success: false, message: error.message }
    }
}
