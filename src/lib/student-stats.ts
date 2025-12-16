import { createClient } from "@/lib/supabase/server"

export async function getUserStats(userId: string) {
    const supabase = await createClient()

    // Fetch all test attempts for this user
    const { data: attempts, error } = await supabase
        .from('test_attempts')
        .select('score, time_spent_seconds, status')
        .eq('user_id', userId)

    if (error) {
        console.error("Error fetching user stats:", error)
        return {
            studyTimeHours: 0,
            averageScore: 0,
            totalAttempts: 0
        }
    }

    if (!attempts || attempts.length === 0) {
        return {
            studyTimeHours: 0,
            averageScore: 0,
            totalAttempts: 0
        }
    }

    // Calculate Study Time (in hours)
    const totalSeconds = attempts.reduce((acc, curr) => acc + (curr.time_spent_seconds || 0), 0)
    const studyTimeHours = Math.round((totalSeconds / 3600) * 10) / 10 // Round to 1 decimal

    // Calculate Average Score (only for completed tests)
    const completedAttempts = attempts.filter(a => a.status === 'completed' && a.score !== null)
    const totalScore = completedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0)
    const averageScore = completedAttempts.length > 0
        ? Math.round(totalScore / completedAttempts.length)
        : 0

    return {
        studyTimeHours,
        averageScore,
        totalAttempts: attempts.length
    }
}
