import React from 'react'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * Full-screen dark container that defines the main flex column layout.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden select-none">
      {children}
    </div>
  )
}
