"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { GraduationCap, Loader2, ArrowRight } from "lucide-react"

export default function JoinClassPage() {
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewClass, setPreviewClass] = useState<any>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleFindClass = async () => {
        setError(null)
        if (!code || code.length !== 6) {
            setError("Please enter a 6-character class code")
            return
        }

        const cleanCode = code.trim().toUpperCase()
        setLoading(true)
        try {
            console.log("Searching for code:", cleanCode)

            // 1. Check Auth
            console.log("Checking auth...")
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                console.error("Auth error:", authError)
                setError("Authentication required. Please sign in again.")
                return
            }
            console.log("User:", user.id)

            // 2. Simple Query (No Join) - Debug step
            const { data: simpleData, error: simpleError } = await supabase
                .from('cohort_codes')
                .select('code')
                .eq('code', cleanCode)
                .maybeSingle()

            if (simpleError) {
                setError(`Error: ${simpleError.message}`)
                return
            }
            if (!simpleData) {
                // Determine if it's an invalid code or RLS issue
                const { count } = await supabase.from('cohort_codes').select('*', { count: 'exact', head: true })
                if (count === 0 || count === null) {
                    // If user sees 0 codes total, it's likely RLS.
                    setError(`Invalid code. (Note: You cannot see any class codes, which suggests a permissions issue. Ask admin to run the fix script.)`)
                } else {
                    setError("Invalid class code. Please check with your teacher.")
                }
                return
            }

            // 3. Full Query with Join
            console.log("Full query for code:", cleanCode)
            const result = await supabase
                .from('cohort_codes')
                .select('cohort_id, cohorts(id, name, courses(title))')
                .eq('code', cleanCode)
                .maybeSingle()

            console.log("Supabase result:", result)
            const { data: codeData, error: codeError } = result

            if (codeError) {
                setError(`DB Error: ${codeError.message} (${codeError.code})`)
                return
            }

            if (!codeData) {
                setError("Invalid class code (Full query returned no data)")
                return
            }

            if (!codeData.cohorts) {
                setError("Code found, but Class data is missing. RLS Issue on 'cohorts' table?")
                return
            }

            setPreviewClass(codeData.cohorts)
        } catch (error: any) {
            console.error("Catch error:", error)
            setError(`App Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinClass = async () => {
        if (!previewClass) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Check if already enrolled
            const { data: existing } = await supabase
                .from('enrollments')
                .select('id')
                .eq('cohort_id', previewClass.id)
                .eq('user_id', user.id)
                .maybeSingle()

            if (existing) {
                toast.error("You're already enrolled in this class")
                router.push('/student')
                return
            }

            // Enroll student
            const { error } = await supabase
                .from('enrollments')
                .insert({
                    cohort_id: previewClass.id,
                    user_id: user.id
                })

            if (error) throw error

            toast.success(`Joined ${previewClass.name}!`)
            router.push('/student')
        } catch (error: any) {
            toast.error("Failed to join class", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Join a Class</CardTitle>
                    <CardDescription>
                        Enter the 6-character code from your teacher
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!previewClass ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="code">Class Code</Label>
                                <Input
                                    id="code"
                                    placeholder="ABC123"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    maxLength={6}
                                    className="text-center text-lg font-mono tracking-wider"
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleFindClass}
                                className="w-full"
                                disabled={loading || code.length !== 6}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Find Class
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
                                <p className="text-sm text-muted-foreground">You're about to join:</p>
                                <h3 className="text-lg font-semibold">{previewClass.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {previewClass.courses?.title || 'SAT Prep'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPreviewClass(null)
                                        setCode("")
                                    }}
                                    className="w-1/2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleJoinClass}
                                    className="w-1/2"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Join Class <ArrowRight className="ml-2 h-4 w-4" /></>}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
