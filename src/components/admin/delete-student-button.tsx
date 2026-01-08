"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteUser } from "@/app/actions/user-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteStudentButtonProps {
    userId: string
    userName: string
}

export function DeleteStudentButton({ userId, userName }: DeleteStudentButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteUser(userId)

            if (result.success) {
                toast.success("Student removed successfully")
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-5 w-5" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently remove <strong>{userName}</strong> and their access to the platform.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={isPending}
                    >
                        {isPending ? "Removing..." : "Remove Student"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
