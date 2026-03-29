import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserByEmail, getChannelsByUserId } from "@/db/queries";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/auth/signin");
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
        redirect("/auth/signin");
    }

    const allChannels = await getChannelsByUserId(user.id);

    if (allChannels.length === 0) {
        redirect("/onboarding");
    }

    // Default to first channel — the sidebar handles active channel via URL params client-side
    const activeChannel = allChannels[0];

    return (
        <div className="min-h-screen bg-[#0c0c0e] flex flex-col md:flex-row">
            <DashboardSidebar
                session={session}
                allChannels={allChannels}
                activeChannel={activeChannel}
            />
            <main className="flex-1 relative overflow-hidden flex flex-col">

                <div className="flex-1 overflow-y-auto relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
