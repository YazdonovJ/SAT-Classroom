import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function seedContent() {
    console.log("🌱 Starting content seeding...")

    // Sign in as owner to pass RLS
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'jamo1iddingrozniy@gmail.com',
        password: 'Yazdon_ov1@2006'
    })

    if (authError) {
        console.error("Auth failed:", authError.message)
        return
    }

    console.log("✓ Authenticated\n")

    // Get all courses
    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')

    if (coursesError) {
        console.error("Error fetching courses:", coursesError.message)
        return
    }

    if (!courses || courses.length === 0) {
        console.error("No courses found. Run seed-courses.js first.")
        return
    }

    console.log(`Found ${courses.length} courses\n`)

    // Define content for each course level (without description field)
    const contentMap = {
        'Foundation': [
            {
                title: 'Introduction to Algebra',
                order_index: 0,
                lessons: [
                    { title: 'Variables and Expressions', content: 'Learn about variables, constants, and algebraic expressions. Practice identifying variables and combining like terms.' },
                    { title: 'Solving Linear Equations', content: 'Practice solving one-step and two-step equations. Understand the balance method and inverse operations.' },
                    { title: 'Word Problems', content: 'Apply algebra to real-world scenarios. Translate words into mathematical expressions and equations.' }
                ]
            },
            {
                title: 'Basic Geometry',
                order_index: 1,
                lessons: [
                    { title: 'Lines and Angles', content: 'Study different types of angles and their properties. Learn about complementary, supplementary, and vertical angles.' },
                    { title: 'Triangles and Quadrilaterals', content: 'Learn about polygon properties and area formulas. Calculate perimeter and area of basic shapes.' },
                    { title: 'Circles', content: 'Explore radius, diameter, circumference, and area. Use π in calculations and solve circle problems.' }
                ]
            },
            {
                title: 'Reading Comprehension Basics',
                order_index: 2,
                lessons: [
                    { title: 'Main Idea and Details', content: 'Identify the central theme of passages. Distinguish between main ideas and supporting details.' },
                    { title: 'Vocabulary in Context', content: 'Determine word meanings from context clues. Use surrounding text to understand unfamiliar words.' },
                    { title: 'Author\'s Purpose', content: 'Understand why authors write what they write. Identify persuasive, informative, and entertaining texts.' }
                ]
            }
        ],
        'Pre SAT': [
            {
                title: 'Advanced Algebra',
                order_index: 0,
                lessons: [
                    { title: 'Quadratic Equations', content: 'Master factoring, completing the square, and the quadratic formula. Solve ax² + bx + c = 0 problems.' },
                    { title: 'Systems of Equations', content: 'Solve systems using substitution and elimination methods. Graph linear systems and find intersection points.' },
                    { title: 'Inequalities', content: 'Work with compound inequalities and graphing on number lines. Solve and represent solution sets.' }
                ]
            },
            {
                title: 'Functions and Graphs',
                order_index: 1,
                lessons: [
                    { title: 'Linear Functions', content: 'Study slope, y-intercept, and graphing lines. Use y = mx + b form and point-slope form.' },
                    { title: 'Exponential Functions', content: 'Learn about growth and decay models. Understand y = a(b)^x patterns in real-world contexts.' },
                    { title: 'Function Transformations', content: 'Shift, stretch, and reflect functions. Apply transformations to parent functions.' }
                ]
            },
            {
                title: 'Evidence-Based Reading',
                order_index: 2,
                lessons: [
                    { title: 'Textual Evidence', content: 'Support answers with specific quotes from passages. Learn to identify relevant supporting details.' },
                    { title: 'Inference Questions', content: 'Draw conclusions from implicit information. Read between the lines and make logical deductions.' },
                    { title: 'Command of Evidence', content: 'Choose the best supporting evidence for claims. Evaluate strength and relevance of textual support.' }
                ]
            },
            {
                title: 'Grammar and Usage',
                order_index: 3,
                lessons: [
                    { title: 'Subject-Verb Agreement', content: 'Ensure subjects and verbs match in number. Handle tricky cases with collective nouns and compound subjects.' },
                    { title: 'Pronoun Usage', content: 'Use pronouns correctly and clearly. Ensure pronoun-antecedent agreement and avoid ambiguous references.' },
                    { title: 'Parallel Structure', content: 'Maintain consistency in lists and comparisons. Use parallel grammatical forms for clarity.' }
                ]
            }
        ],
        'Advanced': [
            {
                title: 'Complex Problem Solving',
                order_index: 0,
                lessons: [
                    { title: 'Rate Problems', content: 'Solve work, distance, and mixture problems. Apply d = rt and combined work formulas.' },
                    { title: 'Percentage Applications', content: 'Master growth, decay, and percent change scenarios. Calculate compound interest and population growth.' },
                    { title: 'Multi-Variable Systems', content: 'Solve complex systems with 3+ variables. Use elimination and matrices for larger systems.' }
                ]
            },
            {
                title: 'Advanced Functions',
                order_index: 1,
                lessons: [
                    { title: 'Polynomial Functions', content: 'Factor and analyze higher-degree polynomials. Find zeros and sketch polynomial graphs.' },
                    { title: 'Rational Expressions', content: 'Simplify and solve rational equations. Identify vertical and horizontal asymptotes.' },
                    { title: 'Radical Equations', content: 'Work with square roots and cube roots. Solve equations involving radicals and check for extraneous solutions.' }
                ]
            },
            {
                title: 'Trigonometry Fundamentals',
                order_index: 2,
                lessons: [
                    { title: 'Right Triangle Trig', content: 'Master SOH-CAH-TOA and applications. Solve real-world problems using sine, cosine, and tangent.' },
                    { title: 'Unit Circle', content: 'Understand radians and reference angles. Memorize key unit circle values.' },
                    { title: 'Trig Identities', content: 'Use Pythagorean and angle sum formulas. Simplify trigonometric expressions.' }
                ]
            },
            {
                title: 'Advanced Reading Analysis',
                order_index: 3,
                lessons: [
                    { title: 'Rhetorical Strategies', content: 'Identify persuasive techniques and appeals. Analyze ethos, pathos, and logos in arguments.' },
                    { title: 'Comparative Passages', content: 'Analyze relationships between paired texts. Compare and contrast author perspectives.' },
                    { title: 'Data Interpretation', content: 'Read and analyze graphs and charts in passages. Synthesize information from visual and textual sources.' }
                ]
            },
            {
                title: 'Advanced Writing',
                order_index: 4,
                lessons: [
                    { title: 'Concision and Clarity', content: 'Eliminate wordiness and redundancy. Choose precise, economical language.' },
                    { title: 'Transitions and Flow', content: 'Connect ideas smoothly and logically. Use transition words effectively.' },
                    { title: 'Tone and Style', content: 'Match language to purpose and audience. Maintain consistent voice and register.' }
                ]
            }
        ]
    }

    // Seed units for each course
    for (const course of courses) {
        const units = contentMap[course.title]

        if (!units) {
            console.log(`⚠️  Skipping "${course.title}" (no content defined)`)
            continue
        }

        console.log(`📚 Seeding content for "${course.title}"...`)

        for (const unitData of units) {
            // Check if unit exists
            const { data: existing } = await supabase
                .from('units')
                .select('id')
                .eq('course_id', course.id)
                .eq('title', unitData.title)
                .maybeSingle()

            let unitId

            if (existing) {
                console.log(`  ↻ Unit "${unitData.title}" already exists`)
                unitId = existing.id
            } else {
                // Create unit (no description field)
                const { data: unit, error: unitError } = await supabase
                    .from('units')
                    .insert({
                        course_id: course.id,
                        title: unitData.title,
                        order_index: unitData.order_index
                    })
                    .select()
                    .single()

                if (unitError) {
                    console.error(`  ✗ Error creating unit "${unitData.title}":`, unitError.message)
                    continue
                }

                unitId = unit.id
                console.log(`  ✓ Created unit "${unitData.title}"`)
            }

            // Create lessons
            if (unitData.lessons) {
                for (let i = 0; i < unitData.lessons.length; i++) {
                    const lessonData = unitData.lessons[i]

                    const { data: existingLesson } = await supabase
                        .from('lessons')
                        .select('id')
                        .eq('unit_id', unitId)
                        .eq('title', lessonData.title)
                        .maybeSingle()

                    if (existingLesson) {
                        console.log(`    ↻ Lesson "${lessonData.title}" already exists`)
                    } else {
                        const { error: lessonError } = await supabase
                            .from('lessons')
                            .insert({
                                unit_id: unitId,
                                title: lessonData.title,
                                content: lessonData.content,
                                order_index: i
                            })

                        if (lessonError) {
                            console.error(`    ✗ Error creating lesson "${lessonData.title}":`, lessonError.message)
                        } else {
                            console.log(`    ✓ Created lesson "${lessonData.title}"`)
                        }
                    }
                }
            }
        }
        console.log("")
    }

    console.log("🎉 Content seeding complete!\n")
}

seedContent()
