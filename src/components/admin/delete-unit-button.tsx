"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteUnit } from "@/app/actions/content-actions"
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

interface DeleteUnitButtonProps {
    unitId: string
    unitTitle: string
}

export function DeleteUnitButton({ unitId, unitTitle }: DeleteUnitButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteUnit(unitId)

            if (result.success) {
                toast.success("Unit deleted successfully")
                setOpen(false)
            } else {
                toast.error(result.message)
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete <strong>{unitTitle}</strong> and all associated lessons, tests, and assignments.
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
                        {isPending ? "Deleting..." : "Delete Unit"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
