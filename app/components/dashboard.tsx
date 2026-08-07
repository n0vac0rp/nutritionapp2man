"use client";

import { useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Utensils, Shield } from "lucide-react";
import AppNav from "./layout/app-nav";
import MobileNav from "./layout/mobile-nav";
import TodaySection from "./sections/today-section";
import LogSection from "./sections/log-section";
import ActivitiesSection from "./sections/activities-section";
import HealthSection from "./sections/health-section";
import AnalyticsSection from "./sections/analytics-section";
import ProfileSection from "./sections/profile-section";
import AdminSection from "./sections/admin-section";
import { calculateBMI } from "../utils/calculations";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("today");

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const bmiResult = calculateBMI(user.weight, user.height);
  const section = isAdmin
    ? activeTab
    : activeTab === "admin"
      ? "today"
      : activeTab;

  const renderSection = () => {
    switch (section) {
      case "log":
        return <LogSection />;
      case "activities":
        return <ActivitiesSection />;
      case "health":
        return <HealthSection />;
      case "analytics":
        return <AnalyticsSection />;
      case "profile":
        return <ProfileSection />;
      case "admin":
        return <AdminSection />;
      case "today":
      default:
        return <TodaySection onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Opaque + a shadow heavy enough to register on dark: Tailwind's default
          10%-black shadows vanish here, which made scrolled content look clipped
          at the header edge rather than passing underneath it. */}
      <header className="border-b border-border bg-background sticky top-0 z-50 shadow-lg shadow-black/50">
        <div className="max-w-8xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-12 xs:h-14">
            <div className="flex items-center gap-1 xs:gap-2">
              <Utensils className="h-5 w-5 xs:h-6 xs:w-6 text-brand" />
              <h1 className="text-lg font-bold text-brand">GluGuide</h1>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 xs:gap-2">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("profile")}
                aria-label="Open profile"
                className="flex items-center gap-1 xs:gap-2 h-auto hover:bg-muted/50 rounded-lg p-1 xs:p-1.5"
              >
                <Avatar className="h-5 w-5 xs:h-6 xs:w-6">
                  <AvatarImage src="/placeholder.svg?height=24&width=24" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {(user.fullName || "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin
                      ? "Administrator"
                      : `BMI: ${bmiResult.bmi} (${bmiResult.category})`}
                  </p>
                </div>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label="Log out"
                className="rounded-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 h-7 w-7 xs:h-8 xs:w-8"
              >
                <LogOut className="h-3 w-3 xs:h-4 xs:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-8xl mx-auto">
        <AppNav
          activeTab={section}
          onTabChange={setActiveTab}
          isAdmin={isAdmin}
        />
        {/* Top padding must use pt-*, not py-*: the responsive `xs:`/`sm:`
            variants are emitted after unprefixed utilities, so a `py-*` variant
            silently overrides `pb-24` and the fixed bottom nav then covers the
            last ~45px of content on mobile. */}
        <main className="flex-1 min-w-0 px-2 xs:px-3 sm:px-4 lg:px-6 pt-4 xs:pt-5 sm:pt-8 pb-24 lg:pb-6">
          {renderSection()}
        </main>
      </div>

      <MobileNav
        activeTab={section}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
      />
    </div>
  );
}
