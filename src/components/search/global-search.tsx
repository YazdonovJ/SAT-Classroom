"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Search, Users, BookOpen, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function GlobalSearch({ userRole }: { userRole: 'teacher' | 'student' }) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any>({ classes: [], students: [], lessons: [] })
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 1) {
                performSearch()
            } else {
                setResults({ classes: [], students: [], lessons: [] })
            }
        }, 300) // Debounce

        return () => clearTimeout(timer)
    }, [query])

    const performSearch = async () => {
        setLoading(true)
        const searches: any = { classes: [], students: [], lessons: [] }

        // Search classes
        if (userRole === 'teacher') {
            const { data: classes } = await supabase
                .from('cohorts')
                .select('*, courses(title)')
                .ilike('name', `%${query}%`)
                .limit(5)
            searches.classes = classes || []

            // Search students
            const { data: students } = await supabase
                .from('users')
                .select('*')
                .ilike('full_name', `%${query}%`)
                .limit(5)
            searches.students = students || []
        } else {
            // Students search their enrolled classes
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('cohorts(*, courses(title))')
                    .eq('user_id', user.id)

                searches.classes = enrollments?.map((e: any) => Array.isArray(e.cohorts) ? e.cohorts[0] : e.cohorts).filter((c: any) =>
                    c?.name?.toLowerCase().includes(query.toLowerCase())
                ) || []
            }
        }

        // Search lessons (both roles)
        const { data: lessons } = await supabase
            .from('lessons')
            .select('*, units(title)')
            .ilike('title', `%${query}%`)
            .limit(5)
        searches.lessons = lessons || []

        setResults(searches)
        setLoading(false)
    }

    const handleSelect = (type: string, item: any) => {
        setOpen(false)
        setQuery("")

        if (type === 'class') {
            router.push(`/${userRole}/class/${item.id}`)
        } else if (type === 'student') {
            // Navigate to student profile
        } else if (type === 'lesson') {
            router.push(`/student/lesson/${item.id}`)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-64 justify-start text-muted-foreground">
                    <Search className="h-4 w-4 mr-2" />
                    Search...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search classes, students, lessons..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Searching...
                            </div>
                        )}
                        {!loading && query.length > 1 && (
                            results.classes.length + results.students.length + results.lessons.length === 0 ? (
                                <CommandEmpty>No results found.</CommandEmpty>
                            ) : (
                                <>
                                    {results.classes.length > 0 && (
                                        <CommandGroup heading="Classes">
                                            {results.classes.map((item: any) => (
                                                <CommandItem
                                                    key={item.id}
                                                    onSelect={() => handleSelect('class', item)}
                                                >
                                                    <GraduationCap className="h-4 w-4 mr-2" />
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.courses?.title}
                                                        </p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                    {results.students.length > 0 && userRole === 'teacher' && (
                                        <CommandGroup heading="Students">
                                            {results.students.map((item: any) => (
                                                <CommandItem
                                                    key={item.id}
                                                    onSelect={() => handleSelect('student', item)}
                                                >
                                                    <Users className="h-4 w-4 mr-2" />
                                                    <div>
                                                        <p className="font-medium">{item.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.email}
                                                        </p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                    {results.lessons.length > 0 && (
                                        <CommandGroup heading="Lessons">
                                            {results.lessons.map((item: any) => (
                                                <CommandItem
                                                    key={item.id}
                                                    onSelect={() => handleSelect('lesson', item)}
                                                >
                                                    <BookOpen className="h-4 w-4 mr-2" />
                                                    <div>
                                                        <p className="font-medium">{item.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.units?.title}
                                                        </p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                </>
                            )
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
