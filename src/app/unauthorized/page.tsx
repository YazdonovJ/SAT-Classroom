export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">403</h1>
                <h2 className="text-2xl font-semibold">Unauthorized</h2>
                <p className="text-muted-foreground">
                    You don't have permission to access this page.
                </p>
                <p className="text-sm text-muted-foreground">
                    This page is restricted to administrators only.
                </p>
            </div>
        </div>
    )
}
