"use client"

import { useAuth } from "./contexts/auth-context"
import AuthPage from "./components/auth-page"
import Dashboard from "./components/dashboard"
import LoadingSpinner from "./components/loading-spinner"
import Tutorial from "./components/tutorial"
import RatingDialog from "./components/rating-dialog"

export default function Home() {
  const { user, isLoading, showTutorial, completeTutorial, skipTutorial, showRatingDialog, closeRatingDialog, markAppRated } =
    useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <>
      <Dashboard />
      {showTutorial && <Tutorial onComplete={completeTutorial} onSkip={skipTutorial} />}
      {showRatingDialog && user && (
        <RatingDialog isOpen={showRatingDialog} onClose={closeRatingDialog} userId={user.id} onRated={markAppRated} />
      )}
    </>
  )
}
