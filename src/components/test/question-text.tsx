"use client"

import React from 'react'

interface QuestionTextProps {
    text: string
    className?: string
}

export function QuestionText({ text, className = "" }: QuestionTextProps) {
    if (!text) return null;

    // Split by !IMAGE[url] with robustness for case and spacing
    const parts = text.split(/(!IMAGE\s*\[[^\]]+\])/gi);

    return (
        <div className={`question-text-root ${className}`} data-rendered="true">
            {parts.map((part, i) => {
                const trimmedPart = part.trim()
                if (trimmedPart.toLowerCase().startsWith('!image')) {
                    const urlMatch = trimmedPart.match(/\[(.*?)\]/)
                    const url = urlMatch ? urlMatch[1] : null
                    
                    if (url) {
                        return (
                            <div key={i} className="my-6 overflow-hidden rounded-xl border bg-white shadow-sm flex flex-col items-center p-2">
                                <img 
                                    src={url} 
                                    alt="Question diagram" 
                                    className="max-w-full h-auto max-h-[600px] object-contain" 
                                />
                                <span className="text-[10px] text-muted-foreground mt-1 opacity-50">Diagram attached</span>
                            </div>
                        )
                    }
                }
                
                // For regular text parts
                if (!part.trim() && parts.length > 1) return null;
                
                return (
                    <p key={i} className="text-lg leading-relaxed whitespace-pre-wrap mb-4 last:mb-0">
                        {part}
                    </p>
                )
            })}
        </div>
    )
}
