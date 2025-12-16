"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Save, Eye } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Question {
    id: string
    question_text: string
    question_type: string
    options: string[]
    correct_answer: string
    explanation: string
    points: number
}

interface CreateTestFormProps {
    units: any[]
    redirectPath?: string
}

export function CreateTestForm({ units, redirectPath = '/teacher/content/tests' }: CreateTestFormProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedUnit, setSelectedUnit] = useState("")
    const [timeLimit, setTimeLimit] = useState<number | null>(null)
    const [passingScore, setPassingScore] = useState(70)
    const [maxAttempts, setMaxAttempts] = useState(1)
    const [showAnswers, setShowAnswers] = useState(true)
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const addQuestion = () => {
        const newQuestion: Question = {
            id: `temp-${Date.now()}`,
            question_text: "",
            question_type: "multiple_choice",
            options: ["", "", "", ""],
            correct_answer: "A",
            explanation: "",
            points: 1
        }
        setQuestions([...questions, newQuestion])
    }

    const updateQuestion = (id: string, field: string, value: any) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, [field]: value } : q
        ))
    }

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                const newOptions = [...q.options]
                newOptions[optionIndex] = value
                return { ...q, options: newOptions }
            }
            return q
        }))
    }

    const deleteQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    const handleSave = async (publish: boolean = false) => {
        if (!title || !selectedUnit) {
            toast.error("Please fill in all required fields")
            return
        }

        if (questions.length === 0) {
            toast.error("Please add at least one question")
            return
        }

        // Validate questions
        for (const q of questions) {
            if (!q.question_text) {
                toast.error("All questions must have text")
                return
            }
            if (q.question_type === 'multiple_choice' && q.options.some(o => !o)) {
                toast.error("All answer options must be filled")
                return
            }
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Create test
            const { data: test, error: testError } = await supabase
                .from('tests')
                .insert({
                    unit_id: selectedUnit,
                    title,
                    description,
                    time_limit_minutes: timeLimit,
                    passing_score: passingScore,
                    max_attempts: maxAttempts,
                    show_correct_answers: showAnswers,
                    is_published: publish,
                    created_by: user?.id
                })
                .select()
                .single()

            if (testError) throw testError

            // Create questions
            const questionData = questions.map((q, index) => ({
                test_id: test.id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                points: q.points,
                order_index: index
            }))

            const { error: questionsError } = await supabase
                .from('questions')
                .insert(questionData)

            if (questionsError) throw questionsError

            toast.success(publish ? "Test published successfully!" : "Test saved as draft")
            router.push(redirectPath)
        } catch (error: any) {
            toast.error("Failed to create test", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Test Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Details</CardTitle>
                    <CardDescription>Basic information about the test</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Test Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Algebra Unit 1 Quiz"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="What will students learn from this test?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="unit">Unit *</Label>
                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                            <SelectContent>
                                {units.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                        {unit.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                            <Input
                                id="time-limit"
                                type="number"
                                placeholder="No limit"
                                value={timeLimit || ""}
                                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="passing-score">Passing Score (%)</Label>
                            <Input
                                id="passing-score"
                                type="number"
                                value={passingScore}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value)
                                    setPassingScore(isNaN(val) ? 0 : val)
                                }}
                                min={0}
                                max={100}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="max-attempts">Max Attempts</Label>
                            <Input
                                id="max-attempts"
                                type="number"
                                value={maxAttempts}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value)
                                    setMaxAttempts(isNaN(val) ? 1 : val)
                                }}
                                min={1}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="show-answers"
                            checked={showAnswers}
                            onCheckedChange={setShowAnswers}
                        />
                        <Label htmlFor="show-answers">Show correct answers after submission</Label>
                    </div>
                </CardContent>
            </Card>

            {/* Questions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Questions</CardTitle>
                            <CardDescription>Add questions to your test</CardDescription>
                        </div>
                        <Button onClick={addQuestion}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {questions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No questions added yet</p>
                            <Button onClick={addQuestion} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Question
                            </Button>
                        </div>
                    ) : (
                        questions.map((question, index) => (
                            <Card key={question.id} className="border-l-4 border-l-primary">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">Question {index + 1}</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteQuestion(question.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Question Text *</Label>
                                        <Textarea
                                            value={question.question_text}
                                            onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                                            placeholder="Enter your question here..."
                                            rows={2}
                                        />
                                    </div>

                                    {question.question_type === 'multiple_choice' && (
                                        <div className="space-y-3">
                                            <Label>Answer Options</Label>
                                            {question.options.map((option, optionIndex) => (
                                                <div key={optionIndex} className="flex items-center gap-2">
                                                    <span className="font-bold text-sm w-6">
                                                        {String.fromCharCode(65 + optionIndex)}.
                                                    </span>
                                                    <Input
                                                        value={option}
                                                        onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Correct Answer</Label>
                                            <Select
                                                value={question.correct_answer}
                                                onValueChange={(value) => updateQuestion(question.id, 'correct_answer', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['A', 'B', 'C', 'D'].map((letter) => (
                                                        <SelectItem key={letter} value={letter}>
                                                            Option {letter}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Points</Label>
                                            <Input
                                                type="number"
                                                value={question.points}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value)
                                                    updateQuestion(question.id, 'points', isNaN(val) ? 0 : val)
                                                }}
                                                min={1}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Explanation (Optional)</Label>
                                        <Textarea
                                            value={question.explanation}
                                            onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                                            placeholder="Explain why this answer is correct..."
                                            rows={2}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button variant="outline" onClick={() => handleSave(false)} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                </Button>
                <Button onClick={() => handleSave(true)} disabled={loading}>
                    <Eye className="h-4 w-4 mr-2" />
                    {loading ? "Publishing..." : "Publish Test"}
                </Button>
            </div>
        </div>
    )
}
