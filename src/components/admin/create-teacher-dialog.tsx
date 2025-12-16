"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createTeacherAccount } from "@/app/actions/user-actions"

export function CreateTeacherDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [fullName, setFullName] = useState("")
    const [password, setPassword] = useState("")

    const router = useRouter()
    const supabase = createClient()

    const handleCreate = async () => {
        if (!email || !fullName || !password) {
            toast.error("Please fill in all fields")
            return
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setLoading(true)
        try {
            // Call Server Action
            const result = await createTeacherAccount({
                email,
                password,
                fullName
            })

            if (!result.success) {
                throw new Error(result.message)
            }

            toast.success("Teacher account created successfully")
            setOpen(false)
            setEmail("")
            setFullName("")
            setPassword("")
            router.refresh()
            // Reload page to ensure list updates
            window.location.reload()
        } catch (error: any) {
            toast.error("Failed to create teacher", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Teacher
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Teacher Account</DialogTitle>
                    <DialogDescription>
                        Add a new teacher to the platform
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input
                            id="full-name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="teacher@example.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? "Creating..." : "Create Teacher"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
